import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import Login from "../features/auth/pages/Login";
import VerifyOtp from "../features/auth/pages/VerifyOtp";
import DashboardRouter from "../features/dashboard/DashboardRouter";
import VehiclesPage from "../features/vehicles/pages/VehiclesPage";
import RequestsPage from "../features/parking/pages/RequestsPage";
import EntryExitPage from "../features/guard/pages/EntryExitPage";


function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-bold">صفحه موردنظر پیدا نشد!</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardRouter />,
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },

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
          { path: "entry-exit", element: <EntryExitPage /> },
        ],
      },
    ],
  },
]);

