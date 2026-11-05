// src/layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";
import NavFrame from "../components/shared/NavFrame";

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
    <div dir="rtl" className="flex h-screen overflow-hidden bg-background">
      <NavFrame />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={currentTitle} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* 👇 main فقط padding داره، رنگ پس‌زمینه از والد ارث می‌بره */}
        <main className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-5">
          {/* 👇 Wrapper حالا bg-background هست (شفاف روی والد) - کارت‌ها جدا دیده می‌شن */}
          <div
            key={location.pathname}
            data-nav-content
            className="h-full animate-page-enter overflow-y-auto rounded-2xl bg-background"
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