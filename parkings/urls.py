from django.urls import path
from .views import *

app_name = 'parking'

urlpatterns = [
    #create_space
    path('list/', ParkingSpaceListCreateView.as_view(http_method_names=['get']), name='manager_parking_space_list'),
    path('create/', ParkingSpaceListCreateView.as_view(http_method_names=['post']), name='manager_parking_space_create'),
    path('detail/<uuid:pk>/', ParkingSpaceDetailView.as_view(http_method_names=['get']), name='manager_parking_space_detail'),
    path('update/<uuid:pk>/', ParkingSpaceDetailView.as_view(http_method_names=['patch', 'put']), name='manager_parking_space_update'),
    path('delete/<uuid:pk>/', ParkingSpaceDetailView.as_view(http_method_names=['delete']), name='manager_parking_space_delete'),

    #user_request
    #user
    path('requests/list/', ParkingRequestListCreateView.as_view(http_method_names=['get']), name='user_parking_request_list'),
    path('requests/create/', ParkingRequestListCreateView.as_view(http_method_names=['post']), name='user_parking_request_create'),
    path('requests/detail/<int:pk>/', ParkingRequestDetailView.as_view(http_method_names=['get']), name='user_parking_request_detail'),
    path('requests/put/<int:pk>/', ParkingRequestDetailView.as_view(http_method_names=['put']), name='user_parking_request_put'),
    path('requests/patch/<int:pk>/', ParkingRequestDetailView.as_view(http_method_names=['patch']), name='user_parking_request_patch'),
    path('requests/cancel/<int:pk>/', ParkingRequestCancelView.as_view(http_method_names=['patch']), name='user_parking_request_cancel'),
    path('user/dashboard/', UserDashboardView.as_view(http_method_names=['get']), name='user_dashboard'),

    #guest
    path('requests/guest/create/', GuestParkingRequestListCreateView.as_view(http_method_names=['post']), name='guest_parking_request_create'),
    path('requests/guest/list/', GuestParkingRequestListCreateView.as_view(http_method_names=['get']), name='guest_parking_request_list'),

    #manager
    path('requests/review/<int:pk>/', ParkingRequestReviewView.as_view(http_method_names=['patch']),name='manager_parking_request_review'),
    path('requests/approved/', ApprovedParkingRequestListView.as_view(http_method_names=['get']), name='manager_approved_parking_requests'),
    path('requests/needs_review/', NeedsReviewParkingRequestListView.as_view(http_method_names=['get']), name='manager_needs_review_parking_requests'),
    path('requests/canceled/list/', CanceledParkingRequestListView.as_view(http_method_names=['get']), name='manager_canceled_parking_requests'),
    path('space/in_use/list/', InUseParkingListView.as_view(http_method_names=['get']), name='manager_active_parking_space'),
    path('manager/dashboard/', ManagerDashboardView.as_view(http_method_names=['get']), name='manager_dashboard'),
    path('manager/users/list/', ParkingManagerUserListView.as_view(http_method_names=['get']), name='manager_users_list' ),
    path('manager/users/detail/<int:pk>/', ParkingManagerUserDetailView.as_view(http_method_names=['get']), name='manager_user_detail' ),
    path('manager/users/activate/<int:pk>/', ParkingManagerUserDetailView.as_view(http_method_names=['patch']), name='manager_user_activate' ),
    path('manager/users/deactivate/<int:pk>/', ParkingManagerUserDetailView.as_view(http_method_names=['patch']), name='manager_user_deactivate' ),
    path('manager/vehicles/list/', ParkingManagerVehicleListView.as_view(http_method_names=['get']), name='manager_vehicle_list'),
    path('manager/vehicles/detail/<int:pk>/', ParkingManagerVehicleDetailView.as_view(http_method_names=['get']), name='manager_vehicle_detail'),
    path('manager/vehicles/activate/<int:pk>/', ParkingManagerVehicleDetailView.as_view(http_method_names=['patch']), name='manager_vehicle_activate'),
    path('manager/vehicles/deactivate/<int:pk>/', ParkingManagerVehicleDetailView.as_view(http_method_names=['patch']), name='manager_vehicle_deactivate'),


    #block_space
    path('blocks/list/', ParkingSpaceBlockListCreateView.as_view(http_method_names=['get']), name='manager_parking_space_block_list'),
    path('blocks/create/', ParkingSpaceBlockListCreateView.as_view(http_method_names=['post']), name='manager_parking_space_block_create'),
    path('blocks/detail/<int:pk>/', ParkingSpaceBlockDetailView.as_view(http_method_names=['get']), name='manager_parking_space_block_detail'),
    path('blocks/patch/<int:pk>/', ParkingSpaceBlockDetailView.as_view(http_method_names=['patch']), name='manager_parking_space_block_patch'),
    path('blocks/delete/<int:pk>/', ParkingSpaceBlockDetailView.as_view(http_method_names=['delete']), name='manager_parking_space_block_delete'),

   #entry_exit_log
    #guard
    path('entry_exit/list/', EntryExitLogListCreateView.as_view(http_method_names=['get']), name='guard_entry_exit_list'),
    path('entry_exit/create/', EntryExitLogListCreateView.as_view(http_method_names=['post']), name='guard_entry_exit_create'),
    path('entry_exit/exit/<int:pk>/', VehicleExitView.as_view(http_method_names=['patch']), name='guard_vehicle_exit'),
    path('requests/approved/guard/',ApprovedParkingRequestGuardListView.as_view(http_method_names=['get']), name='requests_approved_guard'),
    path('space/in_use/list/guard/', InUseParkingListView.as_view(http_method_names=['get']),name='active_parking_space_guard'),
    path('guard/vehicle/search/', GuardVehicleSearchView.as_view(http_method_names=['get']), name='guard_vehicle_search'),
    path('guard/dashboard/', GuardDashboardView.as_view(http_method_names=['get']), name='guard_dashboard' ),


]