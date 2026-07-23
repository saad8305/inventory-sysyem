from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView,)
from inventory.views import ProfileUpdateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/',include('inventory.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/profile/', ProfileUpdateView.as_view(), name='profile-update'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)