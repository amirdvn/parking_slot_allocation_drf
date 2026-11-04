import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Info, AlertTriangle, MessageSquare } from "lucide-react";
import { notificationsApi } from "../api";
import type { Notification, NotificationType } from "../../../types/notification";
import Button from "../../../components/ui/Button";

// مپر برای آیکون و رنگ هر نوع اعلان
const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  REQUEST_STATUS: { icon: <MessageSquare size={18} />, color: "bg-blue-100 text-blue-700" },
  REVIEW_NEEDED: { icon: <AlertTriangle size={18} />, color: "bg-orange-100 text-orange-700" },
  SYSTEM: { icon: <Info size={18} />, color: "bg-gray-100 text-gray-700" },
  REMINDER: { icon: <Bell size={18} />, color: "bg-purple-100 text-purple-700" },
};

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 30000, // هر ۳۰ ثانیه یکبار رفرش کن
  });

  // Mutation برای خواندن یک اعلان
  const readOneMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Mutation برای خواندن همه
  const readAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const handleNotificationClick = (notif: Notification) => {
    // اگر خوانده نشده، به عنوان خوانده شده علامت بزن
    if (!notif.is_read) {
      readOneMutation.mutate(notif.id);
    }
    // اگر لینک داشت، هدایت کن
    if (notif.link) {
      // لینک بک‌اند مثل /api/parking/requests/detail/5/ است، ما باید مسیر فرانت رو بسازیم
      // فعلاً لینک رو نادیده می‌گیریم
    }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  if (isLoading) return <div className="p-4">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">اعلان‌ها</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            <CheckCheck size={16} /> خواندن همه ({unreadCount})
          </Button>
        )}
      </div>

      {notifications?.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          هیچ اعلانی برای نمایش وجود ندارد.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.SYSTEM;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  notif.is_read 
                    ? "border-border bg-surface opacity-70" 
                    : "border-primary-200 bg-primary-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${config.color}`}>{config.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${notif.is_read ? "text-text-secondary" : "text-secondary-900"}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-text-secondary" dir="ltr">
                        {new Date(notif.created_date).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;