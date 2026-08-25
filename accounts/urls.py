from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView


app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user_register'),
    path('login/send_otp/', SendLoginOtpView.as_view(), name='send_login_otp'),
    path('login/verify_otp/', VerifyLoginOtpView.as_view(), name='verify_login_otp'),
    path('logout/', LogoutView.as_view(), name='user_logout')
]