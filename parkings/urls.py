from django.urls import path

from .views import ParkingSpaceListCreateView, ParkingSpaceDetailView


urlpatterns = [
    path('list/', ParkingSpaceListCreateView.as_view(), name='parking_space_list'),
    path('create/', ParkingSpaceListCreateView.as_view(), name='parking_space_create'),
    path('detail/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_detail'),
    path('update/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_update'),
    path('delete/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_delete'),
]