// src/components/shared/Header.tsx
import { Bell, Menu, Search, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthContext";
import { notificationsApi } from "../../features/notifications/api";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const roleTranslations: Record<string, string> = {
  USER: "کاربر",
  GUARD: "نگهبان",
  MANAGER: "مدیر سیستم",
};

function Header({ onMenuClick, title }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // دریافت تعداد اعلان‌های خوانده نشده
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60000, // هر ۶۰ ثانیه
  });

  const unreadCount = unreadData?.unread_count || 0;

  return (
    <header
      dir="rtl"
      className="flex h-20 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-background lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-secondary-900">{title}</h1>
          <p className="hidden text-xs text-text-secondary sm:block">
            به پنل مدیریت پارکینگ خوش آمدید
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="جستجو"
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="اعلان‌ها"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="mx-1 h-8 w-px bg-border" />

        <div className="flex items-center gap-2 rounded-xl p-2">
          <UserCircle size={28} className="text-primary-600" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-secondary-900">
              {user?.full_name || "کاربر سیستم"}
            </p>
            <p className="text-xs text-text-secondary">
              {user ? roleTranslations[user.role] : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;