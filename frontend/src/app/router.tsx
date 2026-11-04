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

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-bold">صفحه موردنظر پیدا نشد!</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  // 👇 مسیرهای عمومی - بیرون از ProtectedRoute
  { path: "/login", element: <Login /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/register", element: <Register /> },  // ⬅️ اینجا!

  // 👇 مسیرهای محافظت شده - داخل ProtectedRoute
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardRouter /> },
          { path: "vehicles", element: <VehiclesPage /> },
          { path: "requests", element: <RequestsPage /> },
          { path: "guest-request", element: <GuestRequestPage /> },
          { path: "entry-exit", element: <EntryExitPage /> },
          { path: "manage-requests", element: <ManagerRequestsPage /> },
          { path: "parking", element: <ManagerParkingPage /> },
          { path: "users", element: <ManagerUsersPage /> },
          { path: "reports", element: <ManagerReportsPage /> },
          { path: "notifications", element: <NotificationsPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);