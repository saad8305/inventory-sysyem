from django.contrib import admin
from .models import warehouse,category,product,Stock,transaction

admin.site.register(warehouse)
admin.site.register(category)
admin.site.register(product)
admin.site.register(Stock)
admin.site.register(transaction)