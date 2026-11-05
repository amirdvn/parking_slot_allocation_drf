import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, MessageSquare, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "../api";
import type { Notification, NotificationType } from "../../../types/notification";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  REQUEST_STATUS: { icon: <MessageSquare size={18} />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  REVIEW_NEEDED: { icon: <AlertTriangle size={18} />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  SYSTEM: { icon: <Info size={18} />, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  REMINDER: { icon: <Bell size={18} />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 30000,
  });

  const readOneMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("همه اعلان‌ها خوانده شدند");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={<Bell size={48} />}
            title="هیچ اعلانی وجود ندارد"
            description="هنگامی که اعلان جدیدی داشته باشید، اینجا نمایش داده می‌شود."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: Notification) => {
            const config = typeConfig[notif.type] || typeConfig.SYSTEM;
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) readOneMutation.mutate(notif.id);
                }}
                className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  notif.is_read
                    ? "border-border bg-surface opacity-70"
                    : "border-primary-200 bg-primary-50/30 dark:border-primary-800 dark:bg-primary-900/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${config.color}`}>{config.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-bold ${
                          notif.is_read ? "text-text-secondary" : "text-secondary-900"
                        }`}
                      >
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