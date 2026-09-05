from django.urls import path
from .views import *

urlpatterns = [
    path('me/', ProfileView.as_view(http_method_names=['get']), name='profile_me'),
    path('me/update/', ProfileView.as_view(http_method_names=['put']), name='profile_update'),

]