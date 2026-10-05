from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.views import APIView



class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.for_user(self.request.user)
        return queryset

class NotificationMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.for_user(request.user).filter(id=pk).update(is_read=True)

        if not updated:
            return Response(
                {
                    'detail': 'اعلان پیدا نشد'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(
            {
                'detail': 'اعلان خوانده شد'
            },
            status=status.HTTP_200_OK
        )
    

class NotificationMarkAllAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.for_user(request.user).unread().update(is_read=True)
        return Response(
            {
                'detail': 'همه اعلان‌ها خوانده شدند'
            },
            status=status.HTTP_200_OK
        )



class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        count = Notification.objects.for_user(request.user).unread().count()
     
        return Response(
            {
                'unread_count': count
             }
        )