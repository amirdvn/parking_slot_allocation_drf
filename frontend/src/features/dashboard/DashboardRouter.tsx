import { useAuth } from "../auth/AuthContext";
import UserDashboard from "./UserDashboard";
import GuardDashboard from "./GuardDashboard";
import ManagerDashboard from "./ManagerDashboard";

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "MANAGER") return <ManagerDashboard />;
  if (user?.role === "GUARD") return <GuardDashboard />;

  return <UserDashboard />;
}

export default DashboardRouter;