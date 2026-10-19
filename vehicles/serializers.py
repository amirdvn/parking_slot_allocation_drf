from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = ['id', 'plate_number', 'vehicle_type', 'sub_type', 'color', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']

    def validate_plate_number(self, value):

        if self.instance and self.instance.plate_number == value:

            raise serializers.ValidationError(
                'این همان پلاک فعلی خودروی شماست. اگر قصد تغییر آن را ندارید، این فیلد را نفرستید.'
            )

        queryset = Vehicle.objects.filter(plate_number=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('این پلاک قبلاً برای وسیله نقلیه دیگری ثبت شده است')

        return value



    def validate(self, attrs):
        vehicle_type = attrs.get('vehicle_type') or getattr(self.instance, 'vehicle_type', None)
        sub_type = attrs.get('sub_type') or getattr(self.instance, 'sub_type', None)


        if vehicle_type in [Vehicle.VehicleType.BICYCLE, Vehicle.VehicleType.MOTORCYCLE] and sub_type in[Vehicle.SubType.CARGO, Vehicle.SubType.DISABLED]:
            raise serializers.ValidationError(
                {'sub_type': 'دوچرخه/موتورسیکلت نمی‌تواند دارای حالت غیرمجاز باشد'})
        return attrs