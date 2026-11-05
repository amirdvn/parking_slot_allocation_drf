// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import Login from "../features/auth/pages/Login";
import VerifyOtp from "../features/auth/pages/VerifyOtp";
import Register from "../features/auth/pages/Register";
import DashboardRouter from "../features/dashboard/DashboardRouter";
import VehiclesPage from "../features/vehicles/pages/VehiclesPage";
import RequestsPage from "../features/parking/pages/RequestsPage";
import GuestRequestPage from "../features/parking/pages/GuestRequestPage";
import EntryExitPage from "../features/guard/pages/EntryExitPage";
import ManagerRequestsPage from "../features/manager/pages/ManagerRequestsPage";
import ManagerParkingPage from "../features/manager/pages/ManagerParkingPage";
import ManagerUsersPage from "../features/manager/pages/ManagerUsersPage";
import ManagerReportsPage from "../features/manager/pages/ManagerReportsPage";
import NotificationsPage from "../features/notifications/pages/NotificationsPage";
import SettingsPage from "../features/profile/pages/SettingsPage";
import ManagerVehiclesPage from "../features/manager/pages/ManagerVehiclesPage";

function NotFoundPage() {
  return (
    <main dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="text-[120px] font-bold leading-none text-primary-600/20 select-none">
        404
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-secondary-900">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="text-sm text-text-secondary">
          ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه حذف شده باشد.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/"
          className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          بازگشت به داشبورد
        </a>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background"
        >
          صفحه قبل
        </button>
      </div>
    </main>
  );
}

export const router = createBrowserRouter([
  // مسیرهای عمومی
  { path: "/login", element: <Login /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/register", element: <Register /> },

  // مسیرهای محافظت شده (فقط یک لایه DashboardLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardRouter /> },
          { path: "vehicles", element: <VehiclesPage /> },
          { path: "my-vehicles", element: <VehiclesPage /> },
          { path: "manage-vehicles", element: <ManagerVehiclesPage /> },
          { path: "requests", element: <RequestsPage /> },
          { path: "guest-request", element: <GuestRequestPage /> },
          { path: "entry-exit", element: <EntryExitPage /> },
          { path: "manage-requests", element: <ManagerRequestsPage /> },
          { path: "parking", element: <ManagerParkingPage /> },
          { path: "users", element: <ManagerUsersPage /> },
          { path: "reports", element: <ManagerReportsPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },

  // مسیر ۴۰۴
  { path: "*", element: <NotFoundPage /> },
]);