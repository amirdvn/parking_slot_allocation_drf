from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=11)
    full_name = serializers.CharField(max_length=255)


class SendLoginOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)


class VerifyLoginOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)
    code = serializers.IntegerField(min_value=1000, max_value=9999)


class SendChangePhoneOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)


class VerifyChangePhoneOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)
    code = serializers.IntegerField(min_value=1000, max_value=9999)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


# ==========================================
# Manager User Serializers
# ==========================================

class ParkingManagerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'full_name', 'department',
            'role', 'is_active', 'is_staff', 'description',
            'created_date', 'updated_date',
        ]
        read_only_fields = fields


class ParkingManagerUserToggleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'is_active']
        read_only_fields = ['id']


class ParkingManagerUserRoleUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'is_active', 'role', 'department']
        read_only_fields = ['id']