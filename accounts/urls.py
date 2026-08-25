from django.urls import path
from .views import *

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user_register'),
    path('login/send_otp/', SendLoginOtpView.as_view(), name='send_login_otp'),
    path('login/verify_otp/', VerifyLoginOtpView.as_view(), name='verify_login_otp'),
    path('logout/', LogoutView.as_view(), name='user_logout'),
    path('change_phone/send_otp/', SendChangePhoneOtpView.as_view(), name='send_change_phone_otp'),
    path('change_phone/verify_otp/', VerifyChangePhoneOtpView.as_view(), name='verify_change_phone_otp'),

]