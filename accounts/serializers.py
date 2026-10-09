from rest_framework import serializers
from django.contrib.auth import get_user_model


User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=11)
    full_name = serializers.CharField(max_length=255)
    department = serializers.ChoiceField(choices=User.Department.choices)
    role = serializers.ChoiceField(choices=User.Role.choices)
        
        
class SendLoginOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)


class VerifyLoginOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)
    code = serializers.IntegerField()

class SendChangePhoneOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)

class VerifyChangePhoneOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=11)
    code = serializers.IntegerField(min_value=1000, max_value=9999)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
