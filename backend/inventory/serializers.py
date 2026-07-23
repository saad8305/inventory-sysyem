from rest_framework import serializers
from .models import warehouse, category, product, Stock, transaction,Profile
import jdatetime
from django.utils import timezone
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'avatar']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()
        remove_avatar = self.context.get('request').data.get('remove_avatar')
        if remove_avatar == 'true' or remove_avatar is True:
            if instance.avatar:
                instance.avatar.delete(save=False)
            instance.avatar = None
        elif 'avatar' in validated_data and validated_data['avatar'] is not None:
            instance.avatar = validated_data['avatar']

        for attr, value in validated_data.items():
            if attr != 'avatar':
                setattr(instance, attr, value)
        instance.save()

        return instance
        
class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = warehouse
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    class Meta:
        model = product
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    product_name = serializers.ReadOnlyField(source='product.name')
    product_sell_price = serializers.ReadOnlyField(source='product.sell_price')
    product_sku = serializers.ReadOnlyField(source='product.product_code') # اصلاح نام فیلد بر اساس مدل شما
    class Meta:
        model = Stock
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=product.objects.all())
    product_name = serializers.ReadOnlyField(source='product.name')
    source_warehouse_name = serializers.ReadOnlyField(source='source_warehouse.name')
    destination_warehouse_name = serializers.ReadOnlyField(source='destination_warehouse.name')
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    product_buy_price = serializers.ReadOnlyField(source='product.buy_price')
    product_sell_price = serializers.ReadOnlyField(source='product.sell_price')
    created_at_shamsi = serializers.SerializerMethodField()
    
    class Meta:
        model = transaction
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
        
    def get_created_at_shamsi(self,obj):
        if obj.created_at:
            tehran_dt = obj.created_at.astimezone(timezone.get_fixed_timezone(210))
            shamsi_dt = jdatetime.datetime.fromgregorian(datetime=tehran_dt)
            return shamsi_dt.strftime('%H:%M - %Y/%m/%d')
        return None

    def validate(self, data):
        t_type = data.get('transaction_type')
        prod = data.get('product')
        qty = data.get('quantity')
        source_wh = data.get('source_warehouse')
        dest_wh = data.get('destination_warehouse')

        # ۱. بررسی یکسان نبودن انبارها در انتقال
        if t_type == 'TRANSFER':
            if not source_wh or not dest_wh:
                raise serializers.ValidationError("مبدأ و مقصد الزامی است.")
            if source_wh == dest_wh:
                raise serializers.ValidationError("مبدأ و مقصد نمی‌توانند یکسان باشند.")
            
            # بررسی موجودی کافی در مبدأ برای انتقال
            stock = Stock.objects.filter(warehouse=source_wh, product=prod).first()
            if not stock or stock.quantity < qty:
                raise serializers.ValidationError(f"موجودی کافی در انبار مبدأ نیست. (موجودی فعلی: {stock.quantity if stock else 0})")

        # ۲. بررسی موجودی برای خروج (OUT)
        elif t_type == 'OUT':
            if not source_wh:
                raise serializers.ValidationError("انبار مبدأ برای خروج الزامی است.")
            stock = Stock.objects.filter(warehouse=source_wh, product=prod).first()
            if not stock or stock.quantity < qty:
                raise serializers.ValidationError(f"موجودی کافی برای خروج نیست. (موجودی فعلی: {stock.quantity if stock else 0})")

        # ۳. بررسی انبار برای ورود (IN)
        elif t_type == 'IN':
            if not dest_wh:
                raise serializers.ValidationError("انبار مقصد برای ورود الزامی است.")

        return data

    def create(self, validated_data):
        # ۱. ذخیره خودِ تراکنش
        instance = transaction.objects.create(**validated_data)
        
        # ۲. آپدیت موجودی
        t_type = validated_data.get('transaction_type')
        prod = validated_data.get('product')
        qty = validated_data.get('quantity')
        
        if t_type == 'IN':
            stock, _ = Stock.objects.get_or_create(warehouse=validated_data['destination_warehouse'], product=prod)
            stock.quantity += qty
            stock.save()
            
        elif t_type == 'OUT':
            stock, _ = Stock.objects.get_or_create(warehouse=validated_data['source_warehouse'], product=prod)
            stock.quantity -= qty
            stock.save()
            
        elif t_type == 'TRANSFER':
            # کم کردن از مبدأ
            s_stock, _ = Stock.objects.get_or_create(warehouse=validated_data['source_warehouse'], product=prod)
            s_stock.quantity -= qty
            s_stock.save()
            # اضافه کردن به مقصد
            d_stock, _ = Stock.objects.get_or_create(warehouse=validated_data['destination_warehouse'], product=prod)
            d_stock.quantity += qty
            d_stock.save()
            
        return instance