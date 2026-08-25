from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from .models import OtpCode


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())])

    phone_number = serializers.CharField(
        max_length=11,
        validators=[UniqueValidator(queryset=User.objects.all())])
    class Meta:
        model = User
        fields = ['email', 'phone_number', 'full_name', 'department', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            email = validated_data['email'],
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            department=validated_data['department'],
        )
        return user


        
        
class SendLoginOtpSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpCode
        fields = ['phone_number']


class VerifyLoginOtpSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpCode
        fields = ['phone_number', 'code']

    def validate(self, attrs):
        phone_number = attrs['phone_number']
        code = attrs['code']
        otp_code=OtpCode.objects.filter(phone_number=phone_number, code=code).first()

        if not otp_code:  
            raise serializers.ValidationError('کد تایید اشتباه است')
        attrs['otp_code'] = otp_code
        return attrs



class SendChangePhoneOtpSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpCode
        fields = ['phone_number']

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError('این شماره تلفن قبلاً ثبت شده است')
        return value


