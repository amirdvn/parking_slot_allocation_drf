from django.urls import path
from .views import *

app_name = 'parking'

urlpatterns = [
    #create_space
    path('list/', ParkingSpaceListCreateView.as_view(), name='parking_space_list'),
    path('create/', ParkingSpaceListCreateView.as_view(), name='parking_space_create'),
    path('detail/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_detail'),
    path('update/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_update'),
    path('delete/<uuid:pk>/', ParkingSpaceDetailView.as_view(), name='parking_space_delete'),
    #user_request
    path('requests/list/', ParkingRequestListCreateView.as_view(), name='parking_request_list'),
    path('requests/create/', ParkingRequestListCreateView.as_view(), name='parking_request_create'),
    path('requests/detail/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_detail'),
    path('requests/put/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_put'),
    path('requests/patch/<int:pk>/', ParkingRequestDetailView.as_view(), name='parking_request_patch'),
    path('requests/delete/<int:pk>/', ParkingRequestDetailView.as_view(),name='parking_request_delete'),
    path('requests/cancel/<int:pk>/', ParkingRequestCancelView.as_view(), name='parkingـrequestـcancel'),
    #block_space
    path('blocks/list/', ParkingSpaceBlockListCreateView.as_view(), name='parking_space_block_list'),
    path('blocks/create/', ParkingSpaceBlockListCreateView.as_view(), name='parking_space_block_create'),
    path('blocks/<int:pk>/', ParkingSpaceBlockDetailView.as_view(), name='parking_space_block_detail'),
    path('blocks/put/<int:pk>/', ParkingSpaceBlockDetailView.as_view(), name='parking_space_block_put'),
    path('blocks/patch/<int:pk>/', ParkingSpaceBlockDetailView.as_view(), name='parking_space_block_patch'),
    path('blocks/delete/<int:pk>/', ParkingSpaceBlockDetailView.as_view(), name='parking_space_block_delete'),
    #entry_exit_log
    path('entry_exit/list/', EntryExitLogListCreateView.as_view(), name='entry_exit_list'),
    path('entry_exit/create/', EntryExitLogListCreateView.as_view(), name='entry_exit_create'),
    path('entry_exit/exit/<int:pk>/', VehicleExitView.as_view(), name='vehicle_exit'),
]