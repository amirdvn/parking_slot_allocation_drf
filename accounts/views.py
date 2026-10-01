from rest_framework.views import APIView
from .serializers import RegisterSerializer, SendLoginOtpSerializer, VerifyLoginOtpSerializer, SendChangePhoneOtpSerializer, VerifyChangePhoneOtpSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from profiles.serializers import ProfileSerializer
from drf_spectacular.utils import extend_schema
from .services import OtpService, UserService, AuthService
from .throttles import (
    LoginSendOtpThrottle,
    LoginVerifyOtpThrottle,
    RegisterThrottle,
    ChangePhoneSendOtpThrottle,
    ChangePhoneVerifyOtpThrottle,
)


@extend_schema(auth=[],  request=RegisterSerializer)
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            UserService.register(serializer.validated_data)
            return Response(
                {
                    'messages': 'ثبت نام با موفقیت انجام شد'
                }, 
                status=status.HTTP_201_CREATED
            )
        
        except ValueError as e:
            return Response(
                {
                    'error':str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

@extend_schema(auth=[],  request=SendLoginOtpSerializer)
class SendLoginOtpView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginSendOtpThrottle]

    def post(self, request):
        serializer = SendLoginOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            
            phone_number = serializer.validated_data['phone_number']
            OtpService.send_otp(phone_number)
            return Response(
                {
                    'messages':'کد تایید ارسال شد'
                },
                status=status.HTTP_200_OK)
       
        except ValueError as e:
            return Response(
                {
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST)

@extend_schema(auth=[],  request=VerifyLoginOtpSerializer)
class VerifyLoginOtpView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginVerifyOtpThrottle]

    def post(self, request):
        serializer = VerifyLoginOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            
            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']
            
            result = AuthService.verify_login_otp(
                phone_number,
                code
            )
            
            return Response(
                result,
                status=status.HTTP_200_OK
            )
        
        except ValueError as e:

            return Response(
                {
                    'error':str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            AuthService.logout(request.data['refresh'])
            
            return Response(
                {
                    'message': 'خروج با موفقیت انجام شد'
                },
                status=status.HTTP_205_RESET_CONTENT)
        
        except ValueError as e:

            return Response(
                {
                    'error':str(e)
                },
                status=status.HTTP_400_BAD_REQUEST)


class SendChangePhoneOtpView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangePhoneSendOtpThrottle]

    def post(self, request):
        
        serializer = SendChangePhoneOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            
            phone_number = serializer.validated_data['phone_number']
            OtpService.send_change_phone_otp(request.user, phone_number)
            
            return Response(
                {
                    'messages':'کد تایید ارسال شد'
                },
                status=status.HTTP_200_OK
            )
       
        except ValueError as e:
            
            return Response(
                {
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyChangePhoneOtpView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangePhoneVerifyOtpThrottle]

    def post(self, request):
        serializer = VerifyChangePhoneOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:

            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']

            user = UserService.change_phone(
                user=request.user,
                new_phone_number=phone_number,
                code=code
            )
            return Response(
                {
                    'message': 'شماره تلفن با موفقیت تغییر کرد',
                    'user':ProfileSerializer(user).data
                },
                status=status.HTTP_200_OK
            )

        except ValueError as e:

            return Response(
                {'error':str(e)},
                status=status.HTTP_400_BAD_REQUEST)