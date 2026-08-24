from rest_framework.views import APIView
from .serializers import RegisterSerializer, SendLoginOtpSerializer
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
import random
from utils import send_otp_code
from .models import OtpCode

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
            return Response(
                {'messages':'کد تایید ارسال شد'},
                status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
