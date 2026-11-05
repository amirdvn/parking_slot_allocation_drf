// src/components/shared/Sidebar.tsx
import {
  LayoutDashboard, ParkingSquare, Car, ClipboardList, Users, FileBarChart,
  Bell, Settings, LogOut, X, LogIn,
} from "lucide-react";
import { NavLink } from "react-router-dom";
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

  const navigationItems = [
    ...commonItems,
    ...(user ? roleBasedItems[user.role as keyof typeof roleBasedItems] || [] : []),
  ];

  const handleLogout = () => {
    toast.success("با موفقیت خارج شدید");
    setTimeout(() => logout(), 400);
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
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-white transition-transform duration-300 ease-out dark:bg-[#1c1c1e] lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#007aff] dark:bg-[#0a84ff]">
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

          <div className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                      isActive
                        ? "bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={2} />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 dark:border-[#38383a]">
          <div className="space-y-0.5">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2c2c2e]"
                }`
              }
            >
              <Settings size={19} strokeWidth={2} />
              <span>تنظیمات</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#ff3b30] transition-colors hover:bg-red-50 dark:text-[#ff453a] dark:hover:bg-[#ff453a]/10"
            >
              <LogOut size={19} strokeWidth={2} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;