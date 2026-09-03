from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/profile/', include('profiles.urls')),
    path('api/vehicle/', include('vehicles.urls')),
    path('api/parking/', include('parkings.urls')),
    path('api/notifications/', include('notifications.urls')),
]
