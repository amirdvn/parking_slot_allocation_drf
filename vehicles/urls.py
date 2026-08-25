from django.urls import path
from .views import *


urlpatterns = [
    path('list/', VehicleListCreateView.as_view(), name='vehicle_list'),
    path('create/', VehicleListCreateView.as_view(), name='vehicle_create'),
]