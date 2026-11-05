// src/components/shared/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { ParkingSquare } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background"
      >
        {/* لوگو انیمیشنی */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-primary-500/20" />
          <div className="relative rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 shadow-xl shadow-primary-600/30">
            <ParkingSquare size={36} className="text-white" />
          </div>
        </div>

        {/* متن */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-secondary-900">پارکینگ هوشمند</h1>
          <p className="mt-1 text-sm text-text-secondary">در حال بارگذاری...</p>
        </div>

        {/* نقطه‌های لودینگ */}
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;