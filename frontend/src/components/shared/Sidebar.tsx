// src/components/shared/Sidebar.tsx
import {
  LayoutDashboard, ParkingSquare, Car, ClipboardList, Users, FileBarChart,
  Bell, Settings, LogOut, X, LogIn,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { toast } from "sonner";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const commonItems = [
  { title: "داشبورد", path: "/", icon: LayoutDashboard },
  { title: "اعلان‌ها", path: "/notifications", icon: Bell },
];

const roleBasedItems = {
  USER: [
    { title: "خودروهای من", path: "/vehicles", icon: Car },
    { title: "درخواست‌های من", path: "/requests", icon: ClipboardList },
    { title: "درخواست مهمان", path: "/guest-request", icon: LogIn },
  ],
  GUARD: [
    { title: "ثبت ورود/خروج", path: "/entry-exit", icon: ParkingSquare },
  ],
  MANAGER: [
    { title: "مدیریت پارکینگ", path: "/parking", icon: ParkingSquare },
    { title: "مدیریت درخواست‌ها", path: "/manage-requests", icon: ClipboardList },
    { title: "مدیریت کاربران", path: "/users", icon: Users },
    { title: "مدیریت خودروها", path: "/manage-vehicles", icon: Car },
    { title: "خودروهای من", path: "/my-vehicles", icon: Car },
    { title: "گزارش‌ها", path: "/reports", icon: FileBarChart },
  ],
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navigationItems = [
    ...commonItems,
    ...(user ? roleBasedItems[user.role as keyof typeof roleBasedItems] || [] : []),
  ];

  const handleLogout = () => {
    toast.success("با موفقیت خارج شدید");
    setTimeout(() => logout(), 400);
  };

  const renderNavItem = (item: { title: string; path: string; icon: any }) => {
    const Icon = item.icon;
    const isActive = pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        data-active-nav={isActive}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
          isActive
            ? "bg-[#007aff]/8 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
        }`}
      >
        {/* 👇 آیکون: سایه و رنگ قوی‌تر */}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            isActive
              ? "bg-[#007aff]/12 shadow-md shadow-[#007aff]/25 dark:bg-[#0a84ff]/15 dark:shadow-[#0a84ff]/20"
              : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-[#2c2c2e]"
          }`}
        >
          <Icon
            data-icon="true"
            size={isActive ? 20 : 19}
            strokeWidth={isActive ? 3 : 2}
            className={`transition-all duration-300 ${
              isActive
                ? "animate-icon-pop text-[#007aff] drop-shadow-[0_2px_4px_rgba(0,122,255,0.5)] dark:text-[#0a84ff] dark:drop-shadow-[0_2px_4px_rgba(10,132,255,0.5)]"
                : ""
            }`}
          />
        </span>

        <span
          className={`transition-all ${
            isActive ? "font-semibold" : "font-medium"
          }`}
        >
          {item.title}
        </span>
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        dir="rtl"
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col border-l border-gray-200 bg-white transition-transform duration-300 ease-out dark:border-[#2c2c2e] dark:bg-[#1c1c1e] lg:static lg:translate-x-0 lg:shadow-[1px_0_0_0_rgba(0,0,0,0.04)] dark:lg:shadow-[1px_0_0_0_rgba(255,255,255,0.04)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-[#2c2c2e]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#007aff] shadow-md shadow-[#007aff]/30 dark:bg-[#0a84ff] dark:shadow-[#0a84ff]/25">
              <ParkingSquare size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                پارکینگ هوشمند
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-500">
                سیستم مدیریت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-[#2c2c2e]"
            aria-label="بستن"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-1.5 px-3 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            منوی اصلی
          </p>
          <div className="space-y-0.5">{navigationItems.map(renderNavItem)}</div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 dark:border-[#2c2c2e]">
          <div className="space-y-0.5">
            <NavLink
              to="/settings"
              onClick={onClose}
              data-active-nav={pathname === "/settings"}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                pathname === "/settings"
                  ? "bg-[#007aff]/8 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  pathname === "/settings"
                    ? "bg-[#007aff]/12 shadow-md shadow-[#007aff]/25 dark:bg-[#0a84ff]/15 dark:shadow-[#0a84ff]/20"
                    : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-[#2c2c2e]"
                }`}
              >
                <Settings
                  data-icon="true"
                  size={pathname === "/settings" ? 20 : 19}
                  strokeWidth={pathname === "/settings" ? 3 : 2}
                  className={`transition-all duration-300 ${
                    pathname === "/settings"
                      ? "animate-icon-pop text-[#007aff] drop-shadow-[0_2px_4px_rgba(0,122,255,0.5)] dark:text-[#0a84ff] dark:drop-shadow-[0_2px_4px_rgba(10,132,255,0.5)]"
                      : ""
                  }`}
                />
              </span>
              <span
                className={`transition-all ${
                  pathname === "/settings" ? "font-semibold" : "font-medium"
                }`}
              >
                تنظیمات
              </span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#ff3b30] transition-colors hover:bg-red-50 dark:text-[#ff453a] dark:hover:bg-[#ff453a]/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:bg-red-100 dark:group-hover:bg-[#ff453a]/10">
                <LogOut size={19} strokeWidth={2} />
              </span>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;