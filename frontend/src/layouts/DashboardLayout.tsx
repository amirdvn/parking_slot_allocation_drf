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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || "پنل مدیریت";

  return (
    <div dir="rtl" className="flex h-screen overflow-hidden bg-background">
      {/* نخ و قاب فقط برای صفحات غیر از تنظیمات */}
      {location.pathname !== "/settings" && <NavFrame />}

      {/* سایدبار */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* بخش اصلی */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={currentTitle}
          onMenuClick={() => setIsSidebarOpen(true)}
          isCollapsed={isCollapsed}
          onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-5">
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