from rest_framework import serializers
from .models import ParkingSpace

class ParkingSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpace
        fields = ['id', 'code', 'zone', 'floor', 'space_type', 'is_active', 'requires_permission', 'description']
        read_only_fields = ['id', 'code', 'requires_permission', 'is_active']
        