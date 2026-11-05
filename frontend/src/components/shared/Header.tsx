// src/components/shared/Header.tsx
import { useState, useRef, useEffect } from "react";
import {
  Bell, Menu, Sun, Moon, User, Settings, LogOut, ChevronDown,
  PanelRightClose, PanelRightOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../features/theme/ThemeContext";
import { notificationsApi } from "../../features/notifications/api";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

const roleTranslations: Record<string, string> = {
  USER: "کاربر",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};

function Header({ onMenuClick, title, isCollapsed, onCollapseToggle }: HeaderProps) {
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
  const avatarLetter = user?.full_name?.charAt(0) || "?";

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

  const handleLogout = () => {
    setProfileOpen(false);
    toast.success("با موفقیت خارج شدید");
    setTimeout(() => logout(), 400);
  };

  return (
    <header
      dir="rtl"
      data-dashboard-header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl sm:px-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e] lg:hidden"
          aria-label="منو"
        >
          <Menu size={20} />
        </button>

        {onCollapseToggle && (
          <button
            onClick={onCollapseToggle}
            className="hidden rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e] lg:block"
            title={isCollapsed ? "باز کردن منو" : "بستن منو"}
          >
            {isCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
          </button>
        )}

        <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
          aria-label={theme === "dark" ? "روشن" : "تیره"}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
          aria-label="اعلان‌ها"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold text-white dark:bg-[#ff453a]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-[13px] font-semibold text-white dark:bg-[#0a84ff]">
              {avatarLetter}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                {user?.full_name || "کاربر"}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500">
                {user ? roleTranslations[user.role] : ""}
              </p>
            </div>
            <ChevronDown size={14} className="hidden text-gray-400 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 animate-scale-in overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <div className="border-b border-border p-4">
                <p className="truncate text-[14px] font-semibold text-gray-900 dark:text-white">
                  {user?.full_name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-gray-500 dark:text-gray-500" dir="ltr">
                  {user?.phone_number}
                </p>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
                >
                  <User size={16} />
                  پروفایل من
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
                >
                  <Settings size={16} />
                  تنظیمات
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-[#ff3b30] hover:bg-red-50 dark:text-[#ff453a] dark:hover:bg-[#ff453a]/10"
                >
                  <LogOut size={16} />
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