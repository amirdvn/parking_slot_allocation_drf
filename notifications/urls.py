from django.urls import path
from .views import *

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification_list'),
    path('read/<int:pk>/', NotificationMarkAsReadView.as_view(), name='notification_mark_read'),
    path('read_all/', NotificationMarkAllAsReadView.as_view(), name='notification_mark_all_read'),
    path('unread_count/', UnreadNotificationCountView.as_view(), name='notification_unread_count'),
]