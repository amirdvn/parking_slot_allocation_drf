// src/components/shared/Sidebar.tsx
import {
  LayoutDashboard,
  ParkingSquare,
  Car,
  ClipboardList,
  Users,
  FileBarChart,
  Bell,
  Settings,
  LogOut,
  X,
  LogIn,
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
    { title: "مدیریت خودروها", path: "/manage-vehicles", icon: Car }, // 👈 همه خودروها
    { title: "خودروهای من", path: "/my-vehicles", icon: Car },         // 👈 خودروهای شخصی
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
    setTimeout(() => logout(), 500);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        dir="rtl"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* لوگو */}
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-2.5 shadow-lg shadow-primary-600/30">
              <ParkingSquare size={22} className="text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-l from-primary-600 to-primary-400 bg-clip-text text-lg font-bold text-transparent">
                پارکینگ هوشمند
              </h1>
              <p className="text-xs text-text-secondary">سیستم مدیریت پارکینگ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary hover:bg-background lg:hidden"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        {/* منوها */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            منوی اصلی
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-l from-primary-500/10 to-primary-600/5 text-primary-700 shadow-sm ring-1 ring-primary-500/20 dark:from-primary-500/20 dark:to-primary-600/10 dark:text-primary-400"
                      : "text-text-secondary hover:bg-background hover:text-secondary-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-primary-600" />
                    )}
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-primary-600"
                          : "group-hover:scale-110 transition-transform"
                      }
                    />
                    <span>{item.title}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* پایین */}
        <div className="space-y-1 border-t border-border p-4">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                isActive
                  ? "bg-gradient-to-l from-primary-500/10 to-primary-600/5 text-primary-700 ring-1 ring-primary-500/20 dark:text-primary-400"
                  : "text-text-secondary hover:bg-background hover:text-secondary-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-primary-600" />
                )}
                <Settings
                  size={20}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                <span>تنظیمات حساب</span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;