from rest_framework.views import APIView
from .serializers import RegisterSerializer
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
            random_code = random.randint(1000, 9999)
            send_otp_code(phone_number=serializer.validated_data['phone_number'], code=random_code)
            OtpCode.objects.create(phone_number=serializer.validated_data['phone_number'], code=random_code)
            serializer.save()
            return Response(data=serializer.data, status=status.HTTP_201_CREATED)
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

