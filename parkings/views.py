from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, UpdateAPIView, ListAPIView

from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock, EntryExitLog

from .serializers import ParkingSpaceSerializer, ParkingRequestSerializer, ParkingSpaceBlockSerializer, EntryExitLogSerializer, ParkingRequestCancelSerializer, ParkingRequestReviewSerializer, ParkingRequestManagerSerializer

from .permissions import IsManagerUserOrReadOnly, IsGuardUserOrReadOnly, IsManagerOrGuard
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response



#Manager
class ParkingSpaceListCreateView(ListCreateAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]


class ParkingSpaceDetailView(RetrieveUpdateDestroyAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]


class ParkingSpaceBlockListCreateView(ListCreateAPIView):
    serializer_class = ParkingSpaceBlockSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingSpaceBlock.objects.all()
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ParkingSpaceBlockDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ParkingSpaceBlockSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingSpaceBlock.objects.all()


class ParkingRequestReviewView(UpdateAPIView): 
    queryset = ParkingRequest.objects.all() 
    serializer_class = ParkingRequestReviewSerializer 
    permission_classes = [IsManagerUserOrReadOnly] 
    def update(self, request, *args, **kwargs): 
        parking_request = self.get_object()
        if parking_request.status not in [ ParkingRequest.RequestStatus.PENDING, ParkingRequest.RequestStatus.NEEDS_REVIEW, ]:

             return Response( { 
                'detail': 'این درخواست در وضعیت فعلی قابل بررسی نیست' },
                status=status.HTTP_400_BAD_REQUEST )

        serializer = self.get_serializer( data=request.data )
        if serializer.is_valid():
            parking_request.status = ( serializer.validated_data['status'] )
            if parking_request.status == ParkingRequest.RequestStatus.REJECTED:
                parking_request.rejection_reason = ( serializer.validated_data['rejection_reason'] )

            parking_request.save( update_fields=['status', 'updated_date', 'rejection_reason'] ) 

            return Response( {
                'detail': 'وضعیت درخواست با موفقیت تغییر کرد',
                'status': parking_request.status },
                status=status.HTTP_200_OK )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ApprovedParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingRequest.objects.filter(status=ParkingRequest.RequestStatus.APPROVED)


class NeedsReviewParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self): 
        return ParkingRequest.objects.filter( 
        status=ParkingRequest.RequestStatus.NEEDS_REVIEW ).select_related( 'user', 'vehicle', 'parking_space' )


class CanceledParkingRequestListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerUserOrReadOnly]

    def get_queryset(self):
        return ParkingRequest.objects.filter(status__in=[ParkingRequest.RequestStatus.CANCELED, ParkingRequest.RequestStatus.REJECTED]).select_related('user', 'vehicle', 'parking_space')


#User
class ParkingRequestListCreateView(ListCreateAPIView):
     serializer_class = ParkingRequestSerializer
     permission_classes = [IsAuthenticated]
     def get_queryset(self):
        return ParkingRequest.objects.filter(user=self.request.user)
     def perform_create(self, serializer):
        parking_request = serializer.save( user=self.request.user )

        if parking_request.parking_space.space_type == (ParkingSpace.SpaceType.EMERGENCY):
            parking_request.status = ( ParkingRequest.RequestStatus.NEEDS_REVIEW )
            parking_request.save(update_fields=['status'])


class ParkingRequestDetailView(RetrieveUpdateDestroyAPIView): 
    serializer_class = ParkingRequestSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return ParkingRequest.objects.filter(user=self.request.user)


class ParkingRequestCancelView(UpdateAPIView):
    queryset = ParkingRequest.objects.all()
    serializer_class = ParkingRequestCancelSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        parking_request = self.get_object()

        if parking_request.user != request.user:
            return Response(
                {'detail': 'شما اجازه لغو این درخواست را ندارید'},
                status=status.HTTP_403_FORBIDDEN)
        if parking_request.status not in [ ParkingRequest.RequestStatus.PENDING, ParkingRequest.RequestStatus.APPROVED]:
            return Response(
                {'detail': 'این درخواست در وضعیت فعلی قابل لغو نیست'},
                status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            parking_request.status = ParkingRequest.RequestStatus.CANCELED
            parking_request.cancellation_reason = serializer.validated_data['cancellation_reason']

            parking_request.save(update_fields=['status', 'cancellation_reason', 'updated_date'])
            return Response(
                {'detail':'در خواست با موفقیت لغو شد'},
                status=status.HTTP_202_ACCEPTED)
            
        return Response( serializer.errors, status=status.HTTP_400_BAD_REQUEST )


#Guard
class EntryExitLogListCreateView(ListCreateAPIView):
    permission_classes = [IsGuardUserOrReadOnly]
    serializer_class = EntryExitLogSerializer

    def get_queryset(self):
        return EntryExitLog.objects.all()

    def perform_create(self, serializer):
       log = serializer.save(guard=self.request.user)
       parking_request = log.parking_request
       parking_request.status = parking_request.RequestStatus.IN_USE
       parking_request.save(update_fields=['status'])

class VehicleExitView(UpdateAPIView):

    queryset = EntryExitLog.objects.all()
    serializer_class = EntryExitLogSerializer
    permission_classes = [IsGuardUserOrReadOnly]

    def update(self, request, *args, **kwargs):

        log = self.get_object()

        if log.exit_time:
            return Response(
                {'detail': 'خروج این خودرو قبلاً ثبت شده است.'},
                status=status.HTTP_400_BAD_REQUEST)

        log.exit_time = timezone.now()
        log.save(update_fields=['exit_time'])
        parking_request = log.parking_request
        parking_request.status = parking_request.RequestStatus.COMPLETED
        parking_request.save(update_fields=['status'])

        return Response(EntryExitLogSerializer(log).data, status=status.HTTP_200_OK)


class ApprovedParkingRequestGuardListView(ListAPIView):
    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsGuardUserOrReadOnly]

    def get_queryset(self):
        return ParkingRequest.objects.filter(status=ParkingRequest.RequestStatus.APPROVED)



class InUseParkingListView(ListAPIView):

    serializer_class = ParkingRequestManagerSerializer
    permission_classes = [IsManagerOrGuard]

    def get_queryset(self):
        return ParkingRequest.objects.filter(status=ParkingRequest.RequestStatus.IN_USE)