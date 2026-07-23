from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)

    def __str__(self):
        return self.user.username
    
class warehouse(models.Model):
    name=models.CharField(max_length=70,verbose_name="warehouse name")
    location=models.TextField(blank=True,null=True,verbose_name="Adress")
    def __str__(self):
        return self.name

class category(models.Model):
    name=models.CharField(max_length=70,verbose_name="Category name")
    def __str__(self):
        return self.name

class product(models.Model):
    name=models.CharField(max_length=100,verbose_name="Product name")
    product_code=models.CharField(max_length=25,unique=True,verbose_name="Product code")
    barcode=models.CharField(max_length=100,blank=True,null=True,unique=True,verbose_name="Barcode")
    category=models.ForeignKey(category,on_delete=models.SET_NULL,null=True,related_name='products',verbose_name="Category")
    buy_price=models.DecimalField(max_digits=12,decimal_places=2,verbose_name="Buy price")
    sell_price=models.DecimalField(max_digits=12,decimal_places=2,verbose_name="Sell price")
    created_at=models.DateTimeField(auto_now_add=True,verbose_name="Creation date")
    def __str__(self):
        return f"{self.name} ({self.product_code})"
    
class Stock(models.Model):
    warehouse=models.ForeignKey(warehouse,on_delete=models.CASCADE,related_name='stocks',verbose_name="Inventory")
    product=models.ForeignKey(product,on_delete=models.CASCADE,related_name='stocks', verbose_name="Product")
    quantity=models.IntegerField(default=0, verbose_name="Quantity")
    class Meta:
        unique_together=('warehouse','product')
    def __str__(self):
        return f"{self.product.name} in {self.warehouse.name} : {self.quantity}"

class transaction(models.Model):
    transaction_types=(
        ('IN','Input(buy/receipt)'),
        ('OUT','Output(sell/order)'),
        ('TRANSFER','Transfer between warehouses'),
    )
    product=models.ForeignKey(product,on_delete=models.CASCADE,verbose_name="Product")
    source_warehouse=models.ForeignKey(warehouse,on_delete=models.SET_NULL,null=True,blank=True,related_name='outgoing_transactions',verbose_name="First warehouse")
    destination_warehouse=models.ForeignKey(warehouse,on_delete=models.SET_NULL,null=True,blank=True,related_name='incoming_transactions',verbose_name="Last warehouse")
    quantity=models.IntegerField(verbose_name="Quantity")
    transaction_type=models.CharField(max_length=10,choices=transaction_types,verbose_name="Transaction type")
    created_by=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,verbose_name="Registered user")
    created_at=models.DateTimeField(auto_now_add=True, verbose_name="Creation date")
    description=models.TextField(blank=True,null=True,verbose_name="Description")
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.product.name} ({self.quantity})"