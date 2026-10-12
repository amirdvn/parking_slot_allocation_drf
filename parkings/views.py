from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, UpdateAPIView, ListAPIView, CreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock, EntryExitLog

from .serializers import ParkingSpaceSerializer, ParkingRequestSerializer, ParkingSpaceBlockSerializer, EntryExitLogSerializer, ParkingRequestCancelSerializer, ParkingRequestReviewSerializer, ParkingRequestManagerSerializer, GuestParkingRequestSerializer, GuestParkingRequestListSerializer, ParkingManagerUserSerializer, ParkingManagerVehicleSerializer

from .permissions import IsManagerUserOrReadOnly, IsManagerOrGuard, IsManagerForGetOrAuthenticatedForPost, IsManagerUser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from vehicles.models import Vehicle
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from .services import ParkingRequestService, EntryExitLogService, DashboardService


User = get_user_model()

#Manager
@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_space_list"),
    post=extend_schema(operation_id="manager_parking_space_create")
)
class ParkingSpaceListCreateView(ListCreateAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]

@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_space_detail"),
    put=extend_schema(operation_id="manager_parking_space_put"),
    patch=extend_schema(operation_id="manager_parking_space_patch"),
    delete=extend_schema(operation_id="manager_parking_space_delete")
)
class ParkingSpaceDetailView(RetrieveUpdateDestroyAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]

@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_space_block_list"),
    post=extend_schema(operation_id="manager_parking_space_block_create")
)
class ParkingSpaceBlockListCreateView(ListCreateAPIView):
    serializer_class = ParkingSpaceBlockSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingSpaceBlock.objects.all()
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_space_block_retrieve"),
    put=extend_schema(operation_id="manager_parking_space_block_put"),
    patch=extend_schema(operation_id="manager_parking_space_block_patch"),
    delete=extend_schema(operation_id="manager_parking_space_block_destroy")
)
class ParkingSpaceBlockDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ParkingSpaceBlockSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingSpaceBlock.objects.all()

@extend_schema_view(
    put=extend_schema(operation_id="manager_parking_request_review_put"),
    patch=extend_schema(operation_id="manager_parking_request_review_patch")
)
class ParkingRequestReviewView(UpdateAPIView): 

    serializer_class = ParkingRequestReviewSerializer 
    permission_classes = [IsManagerUser] 

    def get_queryset(self):
        return ParkingRequest.objects.select_related('parking_space')


    def update(self, request, *args, **kwargs): 
        parking_request = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)

        try:
            ParkingRequestService.review(
                parking_request,
                serializer.validated_data['status'],
                serializer.validated_data.get('rejection_reason'),
            )

        except ValueError as e:
            return Response(
                {
                    'detail': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'detail': 'وضعیت درخواست با موفقیت تغییر کرد', 
                'status': parking_request.status
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(operation_id="manager_parking_request_approved_list")
class ApprovedParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUser]

    def get_queryset(self): 

        return ParkingRequest.objects.with_relations().filter(status=ParkingRequest.RequestStatus.APPROVED)

@extend_schema(operation_id="manager_parking_request_needs_review_list")
class NeedsReviewParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUser]

    def get_queryset(self): 

        return ParkingRequest.objects.with_relations().filter( 
        status=ParkingRequest.RequestStatus.NEEDS_REVIEW )
@extend_schema(operation_id="manager_parking_request_cancel_list")
class CanceledParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUser]

    def get_queryset(self):
        return ParkingRequest.objects.with_relations().filter(status__in=[ParkingRequest.RequestStatus.CANCELED, ParkingRequest.RequestStatus.REJECTED])

@extend_schema(operation_id="manager_dashboard")
class ManagerDashboardView(APIView):

    permission_classes = [IsManagerUser]

    def get(self, request):
        data = DashboardService.get_manager_dashboard()
        return Response(data)


@extend_schema(operation_id="manager_parking_user_list")
class ParkingManagerUserListView(ListAPIView):
    serializer_class = ParkingManagerUserSerializer
    permission_classes = [IsManagerUser]
    def get_queryset(self):
        return User.objects.all().order_by('-created_date')

@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_user_retrieve"),
    patch=extend_schema(operation_id="manager_parking_user_activate_or_deactivate")
)
class ParkingManagerUserDetailView(RetrieveUpdateAPIView):
     serializer_class = ParkingManagerUserSerializer
     permission_classes = [IsManagerUser]
     def get_queryset(self):
         return User.objects.all()



@extend_schema(operation_id="manager_parking_vehicle_list")
class ParkingManagerVehicleListView(ListAPIView):

    serializer_class = ParkingManagerVehicleSerializer
    permission_classes = [IsManagerUser]

    def get_queryset(self):
        return Vehicle.objects.all().order_by('-created_at')

@extend_schema_view(
    get=extend_schema(operation_id="manager_parking_vehicle_retrieve"),
    patch=extend_schema(operation_id="manager_parking_vehicle_activate_or_deactivate")
)
class ParkingManagerVehicleDetailView(RetrieveUpdateAPIView):

    serializer_class = ParkingManagerVehicleSerializer
    permission_classes = [IsManagerUser]

    def get_queryset(self):
        return Vehicle.objects.all()




#User
@extend_schema_view(
    get=extend_schema(operation_id="user_parking_request_list"),
    post=extend_schema(operation_id="user_parking_request_create")
)
class ParkingRequestListCreateView(ListCreateAPIView):
     serializer_class = ParkingRequestSerializer
     permission_classes = [IsAuthenticated]
     def get_queryset(self):

        return ParkingRequest.objects.with_relations().filter(user=self.request.user)
     def perform_create(self, serializer):
        parking_request = ParkingRequestService.create(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )
        serializer.instance = parking_request

@extend_schema_view(
    get=extend_schema(operation_id="user_parking_request_retrieve"),
    put=extend_schema(operation_id="user_parking_request_put"),
    patch=extend_schema(operation_id="user_parking_request_patch")
)
class ParkingRequestDetailView(RetrieveUpdateAPIView): 
    serializer_class = ParkingRequestSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return ParkingRequest.objects.with_relations().filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        parking_request = self.get_object()
        try:
            ParkingRequestService.check_editable(parking_request)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

@extend_schema(operation_id="user_parking_request_cancel")
class ParkingRequestCancelView(UpdateAPIView):
    serializer_class = ParkingRequestCancelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ParkingRequest.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        parking_request = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)

        try:
            ParkingRequestService.cancel(
                parking_request,
                serializer.validated_data['cancellation_reason'],
            )

        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'detail': 'درخواست با موفقیت لغو شد'},
            status=status.HTTP_200_OK,
        )



@extend_schema(operation_id="user_dashboard")
class UserDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = DashboardService.get_user_dashboard(request.user)
        return Response(data)

#Guard
@extend_schema_view(
    get=extend_schema(operation_id="guard_entry_exit_log_list"),
    post=extend_schema(operation_id="guard_entry_exit_log_create")
)
class EntryExitLogListCreateView(ListCreateAPIView):
    permission_classes = [IsManagerOrGuard]
    serializer_class = EntryExitLogSerializer

    def get_queryset(self):
        return EntryExitLog.objects.with_relations().all()

    def perform_create(self, serializer):
        log = serializer.save(guard=self.request.user)
        if log.parking_request:
            EntryExitLogService.record_entry(log.parking_request)


@extend_schema_view(
    put=extend_schema(operation_id="guard_vehicle_exit_put"),
    patch=extend_schema(operation_id="guard_vehicle_exit_patch")
)
class VehicleExitView(UpdateAPIView):

    serializer_class = EntryExitLogSerializer
    permission_classes = [IsManagerOrGuard]

    def get_queryset(self):
        return EntryExitLog.objects.with_relations().all()

    def update(self, request, *args, **kwargs):

        log = self.get_object()

        try:
            EntryExitLogService.record_exit(log)
        
        except ValueError as e:
            
            return Response(
                {
                    'detail': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            EntryExitLogSerializer(log).data,
            status=status.HTTP_200_OK
        )


@extend_schema(operation_id="guard_approved_parking_request_list")
class ApprovedParkingRequestGuardListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerOrGuard]

    def get_queryset(self):
        return ParkingRequest.objects.with_relations().filter(status=ParkingRequest.RequestStatus.APPROVED)

@extend_schema(operation_id="guard_inuse_parking_space_list")
class InUseParkingListView(ListAPIView):

    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerOrGuard]

    def get_queryset(self):
        return ParkingRequest.objects.with_relations().filter(status=ParkingRequest.RequestStatus.IN_USE)

@extend_schema(operation_id="guard_vehicle_search")
class GuardVehicleSearchView(ListAPIView):

    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerOrGuard]

    def get_queryset(self):

        plate_number = self.request.query_params.get('plate_number')

        if not plate_number:
            return ParkingRequest.objects.none()

        return ParkingRequest.objects.with_relations().filter(
            vehicle__plate_number=plate_number,
            status__in=[ParkingRequest.RequestStatus.APPROVED, ParkingRequest.RequestStatus.IN_USE])

@extend_schema(operation_id="guard_dashboard")
class GuardDashboardView(APIView):
    permission_classes = [IsManagerOrGuard]

    def get(self, request):
        data = DashboardService.get_guard_dashboard()
        return Response(data)

#guest
@extend_schema_view(
    get=extend_schema(operation_id="guest_parking_request_list"),
    post=extend_schema(operation_id="guest_parking_request_create")
)
class GuestParkingRequestListCreateView(ListCreateAPIView):
    permission_classes = [IsManagerForGetOrAuthenticatedForPost]
    def get_serializer_class(self):
        if self.request.method == 'POST':
             return GuestParkingRequestSerializer
        return GuestParkingRequestListSerializer

    def get_queryset(self):

        return ParkingRequest.objects.with_relations().filter(is_guest=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, vehicle=None, is_guest=True)

