from django.urls import path
from .views import *


urlpatterns = [
    path('list/', VehicleListCreateView.as_view(http_method_names=['get']), name='vehicle_list'),
    path('create/', VehicleListCreateView.as_view(http_method_names=['post']), name='vehicle_create'),
    path('detail/<int:pk>/', VehicleDetailView.as_view(http_method_names=['get']), name='vehicle_detail'),
    path('put/<int:pk>/', VehicleDetailView.as_view(http_method_names=['put']), name='vehicle_put'),
    path('patch/<int:pk>/', VehicleDetailView.as_view(http_method_names=['patch']), name='vehicle_patch'),
    path('delete/<int:pk>/', VehicleDetailView.as_view(http_method_names=['delete']), name='vehicle_delete'),
]