from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .models import ParkingSpace, ParkingRequest
from .serializers import ParkingSpaceSerializer, ParkingRequestSerializer
from .permissions import IsManagerUserOrReadOnly
from rest_framework.permissions import IsAuthenticated

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