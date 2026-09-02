from django.urls import path
from .views import *

urlpatterns = [
    path('me/', ProfileView.as_view(), name='profile_me'),
    path('me/update/', ProfileView.as_view(), name='profile_update'),

]