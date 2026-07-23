from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import(WarehouseViewSet,CategoryViewSet,ProductViewSet,StockViewSet,TransactionViewSet,ProfileUpdateView)

router=DefaultRouter()
router.register(r'warehouses',WarehouseViewSet)
router.register(r'categories',CategoryViewSet)
router.register(r'products',ProductViewSet)
router.register(r'stocks',StockViewSet)
router.register(r'transactions',TransactionViewSet)

urlpatterns=[
    path('',include(router.urls)),
    path('users/profile/', ProfileUpdateView.as_view(), name='profile-update'),
]