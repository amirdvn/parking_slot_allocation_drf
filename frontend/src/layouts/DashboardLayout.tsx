
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

const pageTitles: Record<string, string> = {
  "/dashboard": "داشبورد",
  "/parking": "مدیریت پارکینگ",
  "/vehicles": "خودروها",
  "/requests": "درخواست‌ها",
  "/users": "کاربران",
  "/reports": "گزارش‌ها",
  "/notifications": "اعلان‌ها",
};

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] ?? "سیستم مدیریت پارکینگ";

  return (
    <div dir="rtl" className="flex min-h-screen bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={pageTitle}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
