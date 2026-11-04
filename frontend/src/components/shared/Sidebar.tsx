
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
} from "lucide-react";

import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    title: "داشبورد",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "مدیریت پارکینگ",
    path: "/parking",
    icon: ParkingSquare,
  },
  {
    title: "خودروها",
    path: "/vehicles",
    icon: Car,
  },
  {
    title: "درخواست‌ها",
    path: "/requests",
    icon: ClipboardList,
  },
  {
    title: "کاربران",
    path: "/users",
    icon: Users,
  },
  {
    title: "گزارش‌ها",
    path: "/reports",
    icon: FileBarChart,
  },
  {
    title: "اعلان‌ها",
    path: "/notifications",
    icon: Bell,
  },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        dir="rtl"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <div>
            <h1 className="text-lg font-bold text-secondary-900">
              پارکینگ هوشمند
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              سیستم مدیریت پارکینگ
            </p>
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

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-semibold text-text-secondary">
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
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-text-secondary hover:bg-background hover:text-secondary-900"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary hover:bg-background"
          >
            <Settings size={20} />
            تنظیمات
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-danger hover:bg-red-50"
          >
            <LogOut size={20} />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
