import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  AlertTriangle,
  Info,
  Clock,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "../api";
import type { Notification, NotificationType } from "../../../types/notification";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

// 👇 تنظیمات ظاهری هر نوع اعلان
const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; iconBg: string; iconColor: string; label: string }
> = {
  REQUEST_STATUS: {
    icon: <MessageSquare size={18} />,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "وضعیت درخواست",
  },
  REVIEW_NEEDED: {
    icon: <AlertTriangle size={18} />,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    label: "نیازمند بررسی",
  },
  SYSTEM: {
    icon: <Info size={18} />,
    iconBg: "bg-slate-100 dark:bg-slate-700/50",
    iconColor: "text-slate-600 dark:text-slate-300",
    label: "سیستمی",
  },
  REMINDER: {
    icon: <Bell size={18} />,
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    label: "یادآوری",
  },
};

// 👇 فرمت زمان نسبی فارسی
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "همین الان";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "دیروز";
  if (days < 7) return `${days} روز پیش`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} هفته پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ماه پیش`;
  return `${Math.floor(days / 365)} سال پیش`;
}

// 👇 گروه‌بندی بر اساس زمان
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "امروز";
  if (diffDays === 1) return "دیروز";
  if (diffDays < 7) return "این هفته";
  if (diffDays < 30) return "این ماه";
  return "قدیمی‌تر";
}

const GROUP_ORDER = ["امروز", "دیروز", "این هفته", "این ماه", "قدیمی‌تر"];

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

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
    onError: () => toast.error("خطا در علامت‌گذاری اعلان‌ها"),
  });

  // 👇 فیلتر و گروه‌بندی
  const { grouped, totalUnread, totalFiltered } = useMemo(() => {
    if (!notifications) return { grouped: {}, totalUnread: 0, totalFiltered: 0 };

    const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

    const groups: Record<string, Notification[]> = {};
    filtered.forEach((n) => {
      const group = getDateGroup(n.created_date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });

    const unread = notifications.filter((n) => !n.is_read).length;
    return { grouped: groups, totalUnread: unread, totalFiltered: filtered.length };
  }, [notifications, filter]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 👇 Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-600 via-primary-700 to-indigo-900 p-6 text-white shadow-xl">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/20">
              <Bell size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">اعلان‌ها</h1>
              <p className="mt-1 text-sm text-white/70">
                {totalUnread > 0
                  ? `شما ${totalUnread} اعلان خوانده نشده دارید`
                  : "همه اعلان‌ها را دیده‌اید ✅"}
              </p>
            </div>
          </div>

          {totalUnread > 0 && (
            <Button
              variant="outline"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="hidden bg-white/10 text-white border-white/20 hover:bg-white/20 sm:inline-flex"
            >
              <CheckCheck size={16} />
              {readAllMutation.isPending ? "..." : "خواندن همه"}
            </Button>
          )}
        </div>
      </div>

      {/* 👇 Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-secondary-900"
            }`}
          >
            همه ({notifications?.length || 0})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === "unread"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-secondary-900"
            }`}
          >
            خوانده نشده
            {totalUnread > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === "unread"
                    ? "bg-white/20"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {totalUnread}
              </span>
            )}
          </button>
        </div>

        {/* موبایل: خواندن همه */}
        {totalUnread > 0 && (
          <Button
            variant="outline"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="sm:hidden"
          >
            <CheckCheck size={16} />
          </Button>
        )}
      </div>

      {/* 👇 Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : totalFiltered === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            icon={<Inbox size={48} />}
            title={
              filter === "unread"
                ? "اعلان خوانده نشده‌ای ندارید"
                : "هیچ اعلانی وجود ندارد"
            }
            description={
              filter === "unread"
                ? "همه اعلان‌ها را دیده‌اید. کار خوبی کردید!"
                : "هنگامی که اعلان جدیدی داشته باشید، اینجا نمایش داده می‌شود."
            }
            action={
              filter === "unread" && (
                <Button variant="outline" onClick={() => setFilter("all")}>
                  مشاهده همه اعلان‌ها
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter((group) => grouped[group]?.length > 0).map((group) => (
            <div key={group}>
              {/* Group Header */}
              <div className="mb-3 flex items-center gap-2">
                <Clock size={14} className="text-text-secondary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  {group}
                </h3>
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-secondary">
                  {grouped[group].length}
                </span>
              </div>

              {/* Group Items */}
              <div className="space-y-2">
                {grouped[group].map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.SYSTEM;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) readOneMutation.mutate(notif.id);
                      }}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md ${
                        notif.is_read
                          ? "border-border bg-surface opacity-75 hover:opacity-100"
                          : "border-primary-200 bg-gradient-to-l from-primary-50/50 to-surface dark:border-primary-800/50 dark:from-primary-900/10 dark:to-surface"
                      }`}
                    >
                      {/* نوار کناری برای خوانده نشده */}
                      {!notif.is_read && (
                        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-primary-600" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* آیکون */}
                        <div
                          className={`shrink-0 rounded-xl p-2.5 ${config.iconBg} ${config.iconColor} transition-transform group-hover:scale-110`}
                        >
                          {config.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`text-sm font-bold ${
                                    notif.is_read
                                      ? "text-text-secondary"
                                      : "text-secondary-900"
                                  }`}
                                >
                                  {notif.title}
                                </h4>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.iconBg} ${config.iconColor}`}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                                {notif.message}
                              </p>
                            </div>

                            {/* Point + Time */}
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="whitespace-nowrap text-xs text-text-secondary">
                                {timeAgo(notif.created_date)}
                              </span>
                              {!notif.is_read && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-600/50 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;