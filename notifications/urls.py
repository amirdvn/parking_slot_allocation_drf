from django.urls import path
from .views import *

app_name = 'notifications'

urlpatterns = [
    path('list/', NotificationListView.as_view(http_method_names=['get']), name='notification_list'),
    path('read/<int:pk>/', NotificationMarkAsReadView.as_view(http_method_names=['put']), name='notification_mark_read'),
    path('read_all/', NotificationMarkAllAsReadView.as_view(http_method_names=['post']), name='notification_mark_all_read'),
    path('unread_count/', UnreadNotificationCountView.as_view(http_method_names=['get']), name='notification_unread_count'),
]