from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .models import ParkingSpace
from .serializers import ParkingSpaceSerializer
from .permissions import IsManagerUserOrReadOnly

class ParkingSpaceListCreateView(ListCreateAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]


class ParkingSpaceDetailView(RetrieveUpdateDestroyAPIView):
    queryset = ParkingSpace.objects.all()
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsManagerUserOrReadOnly]
