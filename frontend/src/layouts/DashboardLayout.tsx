// src/layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

const pageTitles: Record<string, string> = {
  "/": "داشبورد",
  "/vehicles": "خودروهای من",
  "/my-vehicles": "خودروهای من",
  "/manage-vehicles": "مدیریت خودروها",
  "/requests": "درخواست‌های من",
  "/guest-request": "درخواست مهمان",
  "/entry-exit": "ثبت ورود و خروج",
  "/manage-requests": "مدیریت درخواست‌ها",
  "/parking": "مدیریت پارکینگ",
  "/users": "مدیریت کاربران",
  "/reports": "گزارش‌ها",
  "/notifications": "اعلان‌ها",
  "/settings": "تنظیمات حساب",
};

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || "پنل مدیریت";

  return (
    <div dir="rtl" className="flex min-h-screen bg-background">
      {/* Sidebar - ثابت */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header - ثابت */}
        <Header title={currentTitle} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Main - فقط محتوا انیمیشن داره */}
        <main className="flex-1 overflow-hidden">
          <div
            key={location.pathname}
            className="h-full animate-page-enter overflow-y-auto"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;