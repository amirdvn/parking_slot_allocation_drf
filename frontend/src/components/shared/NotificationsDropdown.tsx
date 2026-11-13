// src/components/shared/NotificationsDropdown.tsx
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../features/notifications/api";

function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 60000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = unreadData?.unread_count || 0;
  const unreadDisplay = unreadCount > 9 ? "9+" : unreadCount;

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
        aria-label="اعلان‌ها"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold text-white dark:bg-[#ff453a]">
            {unreadDisplay}
          </span>
        )}
      </button>

      {isOpen && (
        // 👇 تغییرات اینجا اعمال شده:
        // 1. left-0 به جای right-0 (تا از سمت راست باز بشه و از صفحه بیرون نزنه)
        // 2. bg-white dark:bg-[#1c1c1e] (پس‌زمینه کاملاً مات و سالید)
        // 3. z-[100] (برای اینکه روی همه چیزهای دیگه قرار بگیره)
        <div className="absolute left-0 top-full z-[100] mt-2 w-[340px] animate-scale-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#38383a] dark:bg-[#1c1c1e] sm:w-96">

          {/* هدر Dropdown */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-[#38383a]">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                اعلان‌ها
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} خوانده نشده` : "همه خوانده شده"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => readAll.mutate()}
                disabled={readAll.isPending}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#007aff] transition-colors hover:bg-blue-50 disabled:opacity-50 dark:text-[#0a84ff] dark:hover:bg-[#0a84ff]/10"
              >
                <CheckCheck size={13} />
                همه خوانده
              </button>
            )}
          </div>

          {/* لیست */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]"
                  />
                ))}
              </div>
            ) : !notifications?.length ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
                  <Inbox size={24} />
                </div>
                <p className="text-[13px] text-gray-500">اعلانی ندارید</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#38383a]">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.is_read && readOne.mutate(notif.id)}
                    className={`flex w-full items-start gap-2.5 p-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50 ${
                      !notif.is_read ? "bg-blue-50/40 dark:bg-[#0a84ff]/5" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        !notif.is_read
                          ? "bg-blue-100 text-[#007aff] dark:bg-[#0a84ff]/20 dark:text-[#0a84ff]"
                          : "bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]"
                      }`}
                    >
                      <Bell size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-[12px] ${
                            notif.is_read
                              ? "text-gray-600 dark:text-gray-400"
                              : "font-medium text-gray-900 dark:text-white"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-gray-500">
                          {new Date(notif.created_date).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007aff] dark:bg-[#0a84ff]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsDropdown;