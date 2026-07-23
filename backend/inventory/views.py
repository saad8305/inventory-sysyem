from rest_framework import viewsets
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .models import warehouse,category,product,Stock,transaction,Profile
from .serializers import(WarehouseSerializer,CategorySerializer,ProductSerializer,StockSerializer,TransactionSerializer,UserProfileSerializer)

class ProfileUpdateView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get_serializer_context(self):
        context=super().get_serializer_context()
        context['request']=self.request
        return context
    
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset=warehouse.objects.all()
    serializer_class=WarehouseSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset=category.objects.all()
    serializer_class=CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    
    queryset=product.objects.all()
    serializer_class=ProductSerializer

class StockViewSet(viewsets.ModelViewSet):
    queryset=Stock.objects.all()
    serializer_class=StockSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset=transaction.objects.all()
    serializer_class=TransactionSerializer
    permission_classes=[IsAuthenticated]
    def perform_create(self, serializer):
        tx_type = self.request.data.get('transaction_type')
        product_id = self.request.data.get('product')
        quantity = int(self.request.data.get('quantity', 0))
        warehouse_id = self.request.data.get('destination_warehouse') if tx_type == 'IN' else self.request.data.get('source_warehouse')
        transaction = serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
        if warehouse_id and product_id:
            stock, created = Stock.objects.get_or_create(
                warehouse_id=warehouse_id,
                product_id=product_id,
                defaults={'quantity': 0}
            )

            if tx_type == 'IN':
                stock.quantity += quantity
            elif tx_type == 'OUT':
                stock.quantity -= quantity
                if stock.quantity < 0:
                    stock.quantity = 0
            
            stock.save()
        serializer.save(created_by=self.request.user)
        