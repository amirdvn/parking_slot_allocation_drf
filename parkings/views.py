from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, UpdateAPIView
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock, EntryExitLog
from .serializers import ParkingSpaceSerializer, ParkingRequestSerializer, ParkingSpaceBlockSerializer, EntryExitLogSerializer
from .permissions import IsManagerUserOrReadOnly, IsGuardUserOrReadOnly
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response




class ParkingSpaceListCreateView(ListCreateAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]


class ParkingSpaceDetailView(RetrieveUpdateDestroyAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]



class ParkingRequestListCreateView(ListCreateAPIView):
     serializer_class = ParkingRequestSerializer
     permission_classes = [IsAuthenticated]
     def get_queryset(self):
         return ParkingRequest.objects.filter(user=self.request.user)
     def perform_create(self, serializer):
         serializer.save( user=self.request.user )


class ParkingRequestDetailView(RetrieveUpdateDestroyAPIView): 
    serializer_class = ParkingRequestSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return ParkingRequest.objects.filter(user=self.request.user)


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



class EntryExitLogListCreateView(ListCreateAPIView):
    permission_classes = [IsGuardUserOrReadOnly]
    serializer_class = EntryExitLogSerializer

    def get_queryset(self):
        return EntryExitLog.objects.all()

    def perform_create(self, serializer):
        serializer.save(guard=self.request.user)

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

        return Response(EntryExitLogSerializer(log).data, status=status.HTTP_200_OK)