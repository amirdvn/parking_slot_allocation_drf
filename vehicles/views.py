from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vehicles = Vehicle.objects.filter(user=request.user)
        serializer = VehicleSerializer(vehicles, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = VehicleSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)