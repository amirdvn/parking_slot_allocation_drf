// src/components/shared/Header.tsx
import { useState, useRef, useEffect } from "react";
import { Bell, Menu, Sun, Moon, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = unreadData?.unread_count || 0;

  const avatarLetter = user?.full_name?.charAt(0) || "؟";
  const avatarColor =
    user?.role === "MANAGER"
      ? "from-purple-500 to-purple-700"
      : user?.role === "GUARD"
        ? "from-blue-500 to-blue-700"
        : "from-emerald-500 to-emerald-700";

  // بستن Dropdown با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen]);

  // بستن با ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    if (profileOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    toast.success("با موفقیت خارج شدید");
    setTimeout(() => logout(), 500);
  };

  return (
    <header
      dir="rtl"
      className="flex h-20 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8 transition-colors"
    >
      {/* راست: منو + عنوان */}
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

      {/* چپ: اکشن‌ها */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* دکمه تغییر تم */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label={theme === "dark" ? "روشن کردن تم" : "تاریک کردن تم"}
          title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* اعلان‌ها */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-background"
          aria-label="اعلان‌ها"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="mx-1 h-8 w-px bg-border" />

        {/* آواتار + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className={`flex items-center gap-2 rounded-xl p-1.5 pl-2 transition-colors hover:bg-background ${
              profileOpen ? "bg-background" : ""
            }`}
            aria-label="منوی کاربر"
            aria-expanded={profileOpen}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-md ${avatarColor}`}
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
            <ChevronDown
              size={16}
              className={`hidden text-text-secondary transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-64 animate-scale-in overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
              {/* Header */}
              <div className="border-b border-border bg-gradient-to-l from-primary-50 to-surface p-4 dark:from-primary-900/20 dark:to-surface">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white shadow-md ${avatarColor}`}
                  >
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-secondary-900">
                      {user?.full_name}
                    </p>
                    <p className="truncate text-xs text-text-secondary" dir="ltr">
                      {user?.phone_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-background"
                >
                  <User size={18} className="text-text-secondary" />
                  پروفایل من
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-background"
                >
                  <Settings size={18} className="text-text-secondary" />
                  تنظیمات حساب
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={18} />
                  خروج از حساب
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;