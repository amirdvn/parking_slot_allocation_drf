import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import Login from "../features/auth/pages/Login";
import VerifyOtp from "../features/auth/pages/VerifyOtp";

// یک کامپوننت موقت برای داشبورد تا زمانی که کاملش کنیم
function DashboardHome() {
  return <div className="p-4">به داشبورد خوش آمدید!</div>;
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-bold">صفحه موردنظر پیدا نشد!</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  // مسیرهای عمومی (بدون نیاز به لاگین)
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtp />,
  },

  // مسیرهای محافظت شده (نیاز به لاگین)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
          // در مراحل بعدی بقیه صفحات مثل /vehicles, /parking و ... اضافه می‌شوند
        ],
      },
    ],
  },

  // مسیر 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);