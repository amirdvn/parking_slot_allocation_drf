// src/features/notifications/pages/NotificationsPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { notificationsApi } from "../api";
import Button from "../../../components/ui/Button";

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
  });

  const readOne = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const readAll = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">اعلان‌ها</h2>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} خوانده نشده` : "همه خوانده شده"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
            <CheckCheck size={16} /> خواندن همه
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : !notifications?.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <Inbox size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">اعلانی ندارید</h3>
          <p className="mt-1 text-[13px] text-gray-500">اعلان‌های جدید اینجا ظاهر می‌شوند</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => !notif.is_read && readOne.mutate(notif.id)}
              className={`w-full rounded-2xl bg-surface p-4 text-right shadow-sm transition-shadow hover:shadow-md ${
                !notif.is_read ? "border-r-2 border-r-[#007aff] dark:border-r-[#0a84ff]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  !notif.is_read
                    ? "bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
                    : "bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]"
                }`}>
                  <Bell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] font-medium ${notif.is_read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-500">
                      {new Date(notif.created_date).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#007aff] dark:bg-[#0a84ff]" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;