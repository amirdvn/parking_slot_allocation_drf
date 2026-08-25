from django.urls import path
from .views import *


urlpatterns = [
    path('list/', VehicleListCreateView.as_view(), name='vehicle_list'),
    path('create/', VehicleListCreateView.as_view(), name='vehicle_create'),
    path('detail/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_detail'),
    path('put/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_detail'),
    path('put/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_put'),
    path('patch/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_patch'),
    path('delete/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_delete'),
]