from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListCreateAPIView

from .models import Vehicle
from .serializers import VehicleSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view


@extend_schema_view(
    list=extend_schema(responses=VehicleSerializer(many=True)),

    create=extend_schema(request=VehicleSerializer, responses={201: VehicleSerializer})
)
class VehicleListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VehicleSerializer

    def get_queryset(self):
        vehicle_list = self.request.user.vehicles.all()
        return vehicle_list

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class VehicleDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VehicleSerializer

    def get_queryset(self):
        user_vehicle = Vehicle.objects.filter(user=self.request.user)
        return user_vehicle