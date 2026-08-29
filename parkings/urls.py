from django.urls import path

from .views import *


urlpatterns = [
    path('list/', ParkingSpaceListCreateView.as_view(), name='parking_space_list'),
    path('create/', ParkingSpaceListCreateView.as_view(), name='parking_space_create'),
    path('detail/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_detail'),
    path('update/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_update'),
    path('delete/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_delete'),
    path('requests/list/', ParkingRequestListCreateView.as_view(), name='parking_request_list'),
    path('requests/create/', ParkingRequestListCreateView.as_view(), name='parking_request_create'),
    path('requests/detail/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_detail'),
    path('requests/put/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_put'),
    path('requests/patch/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_patch'),
    path('requests/delete/<int:pk>/', ParkingRequestDetailView.as_view(),name='parking_request_delete'),
]