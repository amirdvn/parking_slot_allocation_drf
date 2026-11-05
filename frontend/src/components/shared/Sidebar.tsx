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
  isCollapsed?: boolean;
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

function Sidebar({ isOpen, isCollapsed = false, onClose }: SidebarProps) {
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
        title={isCollapsed ? item.title : undefined}
        data-active-nav={isActive}
        className={`group relative flex items-center rounded-xl text-[14px] transition-all duration-300 ${
          isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
        } ${
          isActive
            ? "bg-[#007aff]/8 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
        }`}
      >
        <span
          data-icon="true"
          className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            isCollapsed ? "h-10 w-10" : "h-9 w-9"
          } ${
            isActive
              ? "bg-[#007aff]/12 shadow-md shadow-[#007aff]/25 dark:bg-[#0a84ff]/15 dark:shadow-[#0a84ff]/20"
              : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-[#2c2c2e]"
          }`}
        >
          <Icon
            size={isActive ? (isCollapsed ? 22 : 20) : 19}
            strokeWidth={isActive ? 3 : 2}
            className={`transition-all duration-300 ${
              isActive
                ? "animate-icon-pop text-[#007aff] drop-shadow-[0_2px_4px_rgba(0,122,255,0.4)] dark:text-[#0a84ff]"
                : ""
            }`}
          />
        </span>

        <span
          className={`whitespace-nowrap transition-all duration-300 ${
            isCollapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
          } ${isActive ? "font-semibold" : "font-medium"}`}
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
        data-sidebar
        className={`fixed inset-y-0 right-0 z-50 flex shrink-0 flex-col border-l border-border bg-surface transition-all duration-300 ease-out dark:bg-[#1c1c1e] lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${isCollapsed ? "w-64 lg:w-[76px]" : "w-64"}`}
      >
        {/* Logo */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-border ${
            isCollapsed ? "justify-center" : "justify-between px-5"
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007aff] shadow-md shadow-[#007aff]/30 dark:bg-[#0a84ff]">
              <ParkingSquare size={18} className="text-white" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
                <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  پارکینگ هوشمند
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">
                  سیستم مدیریت
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-[#2c2c2e]"
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-2 ${isCollapsed ? "px-2" : "px-3"}`}>
          {!isCollapsed && (
            <p className="mb-1.5 px-3 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              منوی اصلی
            </p>
          )}
          <div className="space-y-1">{navigationItems.map(renderNavItem)}</div>
        </nav>

        {/* Footer */}
        <div className={`border-t border-border py-2 ${isCollapsed ? "px-2" : "p-3"}`}>
          <div className="space-y-1">
            <NavLink
              to="/settings"
              onClick={onClose}
              title={isCollapsed ? "تنظیمات" : undefined}
              data-active-nav={pathname === "/settings"}
              className={`group relative flex items-center rounded-xl text-[14px] transition-all duration-300 ${
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
              } ${
                pathname === "/settings"
                  ? "bg-[#007aff]/8 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <span
                data-icon="true"
                className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  isCollapsed ? "h-10 w-10" : "h-9 w-9"
                } ${
                  pathname === "/settings"
                    ? "bg-[#007aff]/12 shadow-md shadow-[#007aff]/25 dark:bg-[#0a84ff]/15 dark:shadow-[#0a84ff]/20"
                    : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-[#2c2c2e]"
                }`}
              >
                <Settings
                  size={pathname === "/settings" ? (isCollapsed ? 22 : 20) : 19}
                  strokeWidth={pathname === "/settings" ? 3 : 2}
                  className={`transition-all duration-300 ${
                    pathname === "/settings"
                      ? "animate-icon-pop text-[#007aff] drop-shadow-[0_2px_4px_rgba(0,122,255,0.4)] dark:text-[#0a84ff]"
                      : ""
                  }`}
                />
              </span>
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
                } ${pathname === "/settings" ? "font-semibold" : "font-medium"}`}
              >
                تنظیمات
              </span>
            </NavLink>

            <button
              onClick={handleLogout}
              title={isCollapsed ? "خروج" : undefined}
              className={`group flex w-full items-center rounded-xl text-[14px] font-medium text-[#ff3b30] transition-all duration-300 hover:bg-red-50 dark:text-[#ff453a] dark:hover:bg-[#ff453a]/10 ${
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
              }`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  isCollapsed ? "h-10 w-10" : "h-9 w-9"
                } group-hover:bg-red-100 dark:group-hover:bg-[#ff453a]/10`}
              >
                <LogOut size={19} strokeWidth={2} />
              </span>
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
                }`}
              >
                خروج
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;