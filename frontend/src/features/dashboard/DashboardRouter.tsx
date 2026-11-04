// src/features/dashboard/DashboardRouter.tsx
import { useAuth } from "../auth/AuthContext";
import UserDashboard from "./UserDashboard";
import GuardDashboard from "./GuardDashboard";
import ManagerReportsPage from "../manager/pages/ManagerReportsPage"; // 👈 ایمپورت صفحه گزارشات

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "MANAGER") return <ManagerReportsPage />; // 👈 مدیر داشبورد آماری ببینه
  if (user?.role === "GUARD") return <GuardDashboard />;

  return <UserDashboard />;
}

export default DashboardRouter;