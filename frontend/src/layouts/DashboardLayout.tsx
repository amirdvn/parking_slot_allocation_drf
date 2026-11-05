// src/layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

// مپر برای تبدیل مسیر به تیتر فارسی
const pageTitles: Record<string, string> = {
  "/": "داشبورد",
  "/vehicles": "خودروها",
  "/requests": "درخواست‌های من",
  "/guest-request": "درخواست مهمان",
  "/entry-exit": "ثبت ورود و خروج",
  "/manage-requests": "مدیریت درخواست‌ها",
  "/parking": "مدیریت پارکینگ",
  "/users": "مدیریت کاربران",
  "/manage-vehicles": "مدیریت خودروها",
  "/reports": "گزارش‌ها",
  "/notifications": "اعلان‌ها",
  "/settings": "تنظیمات حساب",
};

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // پیدا کردن تیتر بر اساس مسیر فعلی
  const currentTitle = pageTitles[location.pathname] || "پنل مدیریت";

  return (
    <div dir="rtl" className="flex min-h-screen bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={currentTitle}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* 👇 animate-fade-in اضافه شد - با کلید یکتا برای هر مسیر */}
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;