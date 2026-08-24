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

    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['email', 'phone_number', 'full_name',
                'department','role', 'password', 'password_confirm']

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        if password != password_confirm:
            raise serializers.ValidationError('رمز عبور یکسان نمیباشد')
        return attrs


    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email = validated_data['email'],
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            department=validated_data['department'],
            password=validated_data['password']
        )
        return user


        
        
class SendLoginOtpSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpCode
        fields = ['phone_number']