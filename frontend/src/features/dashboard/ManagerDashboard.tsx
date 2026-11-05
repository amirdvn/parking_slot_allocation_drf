// src/features/dashboard/ManagerDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare,
  Users,
  Clock,
  AlertCircle,
  ClipboardList,
  CheckCircle,
  ArrowLeft,
  TrendingUp,
  Car,
  UserPlus,
  FileBarChart,
  Zap,
  Activity,
} from "lucide-react";
import { managerApi } from "../manager/api";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار",
  NEEDS_REVIEW: "نیازمند بررسی",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
  IN_USE: "در حال استفاده",
  COMPLETED: "تکمیل شده",
  CANCELED: "لغو شده",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  NEEDS_REVIEW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  IN_USE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // آمار کلی
  const { data: dashboard, isLoading: isLoadingDash } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
    refetchInterval: 60000,
  });

  // درخواست‌های نیازمند بررسی (برای نمایش آخرین‌ها)
  const { data: pendingRequests, isLoading: isLoadingPending } = useQuery({
    queryKey: ["manager-requests", "needs_review"],
    queryFn: managerApi.getNeedsReviewRequests,
    refetchInterval: 60000,
  });

  // درخواست‌های تایید شده (برای فعالیت اخیر)
  const { data: approvedRequests, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["manager-requests", "approved"],
    queryFn: managerApi.getApprovedRequests,
    refetchInterval: 60000,
  });

  const latestPending = pendingRequests?.slice(0, 3) || [];
  const latestApproved = approvedRequests?.slice(0, 3) || [];

  const greeting =
    new Date().getHours() < 12
      ? "صبح بخیر"
      : new Date().getHours() < 18
        ? "روز بخیر"
        : "شب بخیر";

  const pendingCount = dashboard?.requests.pending || 0;
  const needsReviewCount = dashboard?.requests.needs_review || 0;
  const totalPending = pendingCount + needsReviewCount;

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 via-primary-700 to-purple-900 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/80">{greeting} 👋</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {user?.full_name || "مدیر عزیز"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {totalPending > 0
                ? `شما ${totalPending} درخواست منتظر بررسی دارید`
                : "همه درخواست‌ها بررسی شده‌اند ✅"}
            </p>
          </div>

          {totalPending > 0 && (
            <Button
              onClick={() => navigate("/manage-requests")}
              className="bg-white text-primary-700 shadow-lg hover:bg-white/90"
            >
              <ClipboardList size={18} />
              بررسی درخواست‌ها
            </Button>
          )}
        </div>
      </div>

      {/* 👇 Stat Cards */}
      {isLoadingDash ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <Skeleton className="mb-3 h-11 w-11 rounded-xl" />
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={dashboard.parking_spaces.total}
            icon={<ParkingSquare size={22} />}
            gradient="from-slate-500 to-slate-700"
            shadow="shadow-slate-500/30"
            onClick={() => navigate("/parking")}
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={dashboard.parking_spaces.available}
            icon={<CheckCircle size={22} />}
            gradient="from-emerald-500 to-green-600"
            shadow="shadow-emerald-500/30"
            onClick={() => navigate("/parking")}
          />
          <StatCard
            title="در انتظار بررسی"
            value={dashboard.requests.pending}
            icon={<Clock size={22} />}
            gradient="from-amber-500 to-orange-500"
            shadow="shadow-amber-500/30"
            onClick={() => navigate("/manage-requests")}
          />
          <StatCard
            title="نیازمند بررسی"
            value={dashboard.requests.needs_review}
            icon={<AlertCircle size={22} />}
            gradient="from-rose-500 to-red-600"
            shadow="shadow-rose-500/30"
            onClick={() => navigate("/manage-requests")}
          />
        </div>
      ) : null}

      {/* 👇 Quick Actions */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
            <Zap size={18} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="font-bold text-secondary-900">دسترسی سریع</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction
            icon={<ClipboardList size={20} />}
            title="بررسی درخواست‌ها"
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            onClick={() => navigate("/manage-requests")}
          />
          <QuickAction
            icon={<ParkingSquare size={20} />}
            title="مدیریت پارکینگ"
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            onClick={() => navigate("/parking")}
          />
          <QuickAction
            icon={<Users size={20} />}
            title="مدیریت کاربران"
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            onClick={() => navigate("/users")}
          />
          <QuickAction
            icon={<FileBarChart size={20} />}
            title="گزارش‌ها"
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            onClick={() => navigate("/reports")}
          />
        </div>
      </div>

      {/* 👇 Two Columns: Pending + Recent Approved */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Requests */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                <Clock size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-secondary-900">درخواست‌های منتظر</h2>
                <p className="text-xs text-text-secondary">
                  {latestPending.length} از {pendingRequests?.length || 0}
                </p>
              </div>
            </div>
            {latestPending.length > 0 && (
              <button
                onClick={() => navigate("/manage-requests")}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
              >
                مشاهده همه
                <ArrowLeft size={14} />
              </button>
            )}
          </div>

          {isLoadingPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : latestPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <p className="mt-3 text-sm font-bold text-secondary-900">
                همه درخواست‌ها بررسی شده!
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                کار خوبی کردید
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestPending.map((req) => (
                <div
                  key={req.id}
                  onClick={() => navigate("/manage-requests")}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background/50 p-3 transition-all hover:bg-background hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      <ClipboardList size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-secondary-900">
                        {req.user_detail?.full_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary" dir="ltr">
                        {req.vehicle_detail?.plate_number || "---"} ·{" "}
                        {req.parking_space_detail?.code || "---"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    #{req.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Approved */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-secondary-900">فعالیت اخیر</h2>
                <p className="text-xs text-text-secondary">
                  درخواست‌های تایید شده
                </p>
              </div>
            </div>
            {latestApproved.length > 0 && (
              <button
                onClick={() => navigate("/reports")}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
              >
                گزارش کامل
                <ArrowLeft size={14} />
              </button>
            )}
          </div>

          {isLoadingApproved ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : latestApproved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-gray-100 p-4 text-text-secondary dark:bg-gray-800">
                <Activity size={32} />
              </div>
              <p className="mt-3 text-sm font-bold text-secondary-900">
                هنوز فعالیتی نیست
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                درخواست‌های تایید شده اینجا نمایش داده می‌شوند
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestApproved.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-secondary-900">
                        {req.user_detail?.full_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary" dir="ltr">
                        {req.vehicle_detail?.plate_number || "---"} ·{" "}
                        {req.parking_space_detail?.code || "---"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[req.status] || "bg-gray-100"}`}
                  >
                    {statusLabels[req.status] || req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 👇 Occupancy Bar */}
      {dashboard && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-secondary-900">وضعیت اشغال</h2>
            </div>
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              نمودار کامل
              <ArrowLeft size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <OccupancyBar
              label="آزاد"
              value={dashboard.parking_spaces.available}
              total={dashboard.parking_spaces.total}
              color="bg-gradient-to-l from-emerald-500 to-green-600"
            />
            <OccupancyBar
              label="اشغال"
              value={dashboard.parking_spaces.occupied}
              total={dashboard.parking_spaces.total}
              color="bg-gradient-to-l from-blue-500 to-indigo-600"
            />
            <OccupancyBar
              label="مسدود"
              value={dashboard.parking_spaces.blocked}
              total={dashboard.parking_spaces.total}
              color="bg-gradient-to-l from-red-500 to-rose-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 👇 Stat Card
function StatCard({
  title,
  value,
  icon,
  gradient,
  shadow,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 text-right shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${gradient} ${shadow} transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <p className="text-xs text-text-secondary">{title}</p>
      <p className="mt-1 text-2xl font-bold text-secondary-900">{value}</p>
    </button>
  );
}

// 👇 Quick Action
function QuickAction({
  icon,
  title,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-background hover:shadow-sm"
    >
      <div
        className={`rounded-lg p-2.5 transition-transform group-hover:scale-110 ${color}`}
      >
        {icon}
      </div>
      <span className="text-center text-xs font-medium text-secondary-900">
        {title}
      </span>
    </button>
  );
}

// 👇 Occupancy Bar
function OccupancyBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-secondary-900">{label}</span>
        <span className="text-text-secondary">
          <span className="font-bold text-secondary-900">{value}</span> از {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ManagerDashboard;