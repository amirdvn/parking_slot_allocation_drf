from django.urls import path
from .views import *

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user_register'),
    path('login/send_otp/', SendLoginOtpView.as_view(), name='send_login_otp'),
]