// src/features/dashboard/GuardDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare,
  Car,
  CheckCircle,
  Clock,
  ArrowLeft,
  LogIn,
  ShieldAlert,
  Zap,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { guardApi } from "../guard/api";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";

const COLORS = ["#16a34a", "#3b82f6", "#dc2626"];

function GuardDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["guard-dashboard"],
    queryFn: guardApi.getDashboard,
    refetchInterval: 30000,
  });

  // دریافت لاگ‌های ورود/خروج برای نمایش آخرین خودروهای داخل
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  const activeLogs = logs?.filter((log) => !log.exit_time) || [];
  const latestActive = activeLogs.slice(0, 3);

  const pieData = data
    ? [
        { name: "آزاد", value: data.parking_spaces.available },
        { name: "اشغال", value: data.parking_spaces.occupied },
        { name: "مسدود", value: data.parking_spaces.blocked },
      ].filter((item) => item.value > 0)
    : [];

  const greeting =
    new Date().getHours() < 12
      ? "صبح بخیر"
      : new Date().getHours() < 18
        ? "روز بخیر"
        : "شب بخیر";

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-sky-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {user?.full_name || "نگهبان عزیز"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              وضعیت لحظه‌ای پارکینگ در یک نگاه
            </p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 sm:block">
            <ShieldAlert size={32} />
          </div>
        </div>
      </div>

      {/* 👇 Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={data.parking_spaces.total}
            icon={<ParkingSquare size={24} />}
            gradient="from-slate-500 to-slate-700"
            shadow="shadow-slate-500/30"
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={data.parking_spaces.available}
            icon={<CheckCircle size={24} />}
            gradient="from-emerald-500 to-green-600"
            shadow="shadow-emerald-500/30"
          />
          <StatCard
            title="در حال استفاده"
            value={data.vehicles.in_use}
            icon={<Car size={24} />}
            gradient="from-blue-500 to-indigo-600"
            shadow="shadow-blue-500/30"
          />
          <StatCard
            title="منتظر ورود"
            value={data.requests.approved}
            icon={<Clock size={24} />}
            gradient="from-amber-500 to-orange-500"
            shadow="shadow-amber-500/30"
          />
        </div>
      ) : null}

      {/* 👇 Alerts (هشدارهای هوشمند) */}
      {data && (data.requests.approved > 0 || data.vehicles.in_use > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.requests.approved > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-4 dark:border-amber-800/50 dark:from-amber-900/20 dark:to-surface">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {data.requests.approved} درخواست منتظر ورود
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400/80">
                  این درخواست‌ها آماده ثبت ورود هستند
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/entry-exit")}
                className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                مشاهده
              </Button>
            </div>
          )}

          {data.vehicles.in_use > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-l from-blue-50 to-white p-4 dark:border-blue-800/50 dark:from-blue-900/20 dark:to-surface">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Car size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  {data.vehicles.in_use} خودرو داخل پارکینگ
                </p>
                <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400/80">
                  هنگام خروج، تردد را ثبت کنید
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/entry-exit")}
                className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                مشاهده
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 👇 Pie Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <ParkingSquare size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-bold text-secondary-900">وضعیت جایگاه‌ها</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
              اطلاعاتی برای نمایش وجود ندارد
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} جایگاه`, "تعداد"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 👇 Quick Action + Latest Active */}
        <div className="space-y-4">
          {/* Quick Action */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Zap size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-bold text-secondary-900">عملیات سریع</h2>
            </div>
            <Button
              onClick={() => navigate("/entry-exit")}
              className="w-full justify-between bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <span className="flex items-center gap-2">
                <LogIn size={18} />
                ثبت ورود و خروج
              </span>
              <ArrowLeft size={18} />
            </Button>
          </div>

          {/* Latest Active */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Car size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-bold text-secondary-900">آخرین خودروهای داخل</h2>
              </div>
              {activeLogs.length > 0 && (
                <button
                  onClick={() => navigate("/entry-exit")}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
                >
                  همه
                  <ArrowLeft size={14} />
                </button>
              )}
            </div>

            {isLoadingLogs ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : latestActive.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-secondary">
                هیچ خودرویی داخل پارکینگ نیست
              </div>
            ) : (
              <div className="space-y-2">
                {latestActive.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Car size={14} />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-secondary-900" dir="ltr">
                          {log.vehicle_detail?.plate_number || "---"}
                        </p>
                        <p className="text-[10px] text-text-secondary" dir="ltr">
                          {new Date(log.entry_time).toLocaleTimeString("fa-IR")}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      داخل
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${gradient} ${shadow} transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <p className="text-xs text-text-secondary">{title}</p>
      <p className="mt-1 text-2xl font-bold text-secondary-900">{value}</p>
    </div>
  );
}

export default GuardDashboard;