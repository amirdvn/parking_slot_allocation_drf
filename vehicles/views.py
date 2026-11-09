from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListCreateAPIView
from parkings.permissions import IsManagerUser
from rest_framework.views import APIView

from .models import Vehicle
from .serializers import VehicleSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
from  .services import VehicleReportService
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response

from io import BytesIO
from openpyxl import Workbook
from django.http import HttpResponse


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
    def destroy(self, request, *args, **kwargs):
        try:
            return  super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'این خودرو دارای درخواست یا لاگ پارکینگ است و قابل حذف نیست؛ ابتدا آن‌ها را لغو کنید.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VehicleXlsxReportView(APIView):
    permission_classes = [IsManagerUser]

    def get(self, request):
        wb = Workbook(write_only=True)
        ws = wb.create_sheet('vehicles')
        ws.append(VehicleReportService.HEADER_LABELS)
        for row in VehicleReportService.iter_rows():
            ws.append([row[h] for h in VehicleReportService.HEADERS])

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="vehicles_report.xlsx"'
        return response