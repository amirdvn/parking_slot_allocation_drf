import { Bell, Menu, Search, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../features/theme/ThemeContext";
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = unreadData?.unread_count || 0;

  const avatarLetter = user?.full_name?.charAt(0) || "؟";
  const avatarColor =
    user?.role === "MANAGER"
      ? "bg-purple-600"
      : user?.role === "GUARD"
        ? "bg-blue-600"
        : "bg-emerald-600";

  return (
    <header
      dir="rtl"
      className="flex h-20 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8 transition-colors"
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

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="جستجو"
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label={theme === "dark" ? "روشن کردن تم" : "تاریک کردن تم"}
          title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
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
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
          >
            {avatarLetter}
          </div>
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