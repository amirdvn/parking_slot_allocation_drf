from rest_framework.views import APIView
from .serializers import RegisterSerializer, SendLoginOtpSerializer, VerifyLoginOtpSerializer
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
import random
from utils import send_otp_code
from .models import OtpCode
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken



User = get_user_model()



class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'messages': 'ثبت نام با موفقیت انجام شد'}, 
                status=status.HTTP_201_CREATED)
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendLoginOtpView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = SendLoginOtpSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            random_code = random.randint(1000, 9999)
            OtpCode.objects.create(phone_number=phone_number, code=random_code)
            send_otp_code(phone_number=phone_number, code=random_code)
            return Response(
                {'messages':'کد تایید ارسال شد'},
                status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyLoginOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyLoginOtpSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            otp_code = serializer.validated_data['otp_code']
            otp_code.delete()
            user = User.objects.filter(phone_number=phone_number).first()
            if user:
                tokens = RefreshToken.for_user(user)
                return Response(
                    {
                    'messages': 'ورود موفق بود',
                    'is_registered': True,
                    'tokens': {
                        'refresh': str(tokens),
                        'access': str(tokens.access_token)}},
                    status=status.HTTP_200_OK)
            return Response({
                'messages': 'شماره تایید شد.',
                'is_registered': False},
                status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
