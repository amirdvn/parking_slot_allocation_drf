// src/features/manager/pages/ManagerReportsPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Users,
  ParkingSquare,
  FileSpreadsheet,
  Car,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  AlertCircle,
  Phone,
  MapPin,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";

const COLORS = ["#16a34a", "#3b82f6", "#dc2626"];

const getDefaultDates = () => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  return {
    start: weekAgo.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
};

// 🏆 استایل رتبه‌ها
const getRankStyle = (index: number) => {
  if (index === 0)
    return {
      cardBg: "bg-gradient-to-l from-yellow-50 to-white dark:from-yellow-900/20 dark:to-surface",
      border: "border-yellow-300/60 dark:border-yellow-500/30",
      badge: "bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-yellow-500/40",
      icon: <Crown size={16} className="text-white" />,
      bar: "bg-gradient-to-l from-yellow-400 to-amber-500",
    };
  if (index === 1)
    return {
      cardBg: "bg-gradient-to-l from-slate-50 to-white dark:from-slate-700/20 dark:to-surface",
      border: "border-slate-300/60 dark:border-slate-500/30",
      badge: "bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/40",
      icon: <Medal size={16} className="text-white" />,
      bar: "bg-gradient-to-l from-slate-300 to-slate-500",
    };
  if (index === 2)
    return {
      cardBg: "bg-gradient-to-l from-orange-50 to-white dark:from-orange-900/20 dark:to-surface",
      border: "border-orange-300/60 dark:border-orange-500/30",
      badge: "bg-gradient-to-br from-orange-400 to-orange-700 shadow-lg shadow-orange-500/40",
      icon: <Award size={16} className="text-white" />,
      bar: "bg-gradient-to-l from-orange-400 to-orange-600",
    };
  return {
    cardBg: "bg-surface",
    border: "border-border",
    badge: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 shadow-sm",
    icon: null,
    bar: "bg-gradient-to-l from-primary-400 to-primary-600",
  };
};

function ManagerReportsPage() {
  const { user } = useAuth();
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [isDownloadingEntry, setIsDownloadingEntry] = useState(false);
  const [isDownloadingVehicle, setIsDownloadingVehicle] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
  });

  const handleDownloadEntryExit = async () => {
    if (!startDate || !endDate) {
      toast.error("لطفاً تاریخ شروع و پایان را وارد کنید");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("تاریخ شروع باید قبل از تاریخ پایان باشد");
      return;
    }
    setIsDownloadingEntry(true);
    try {
      await managerApi.downloadEntryExitReport(startDate, endDate);
      toast.success("گزارش با موفقیت دانلود شد");
    } catch {
      toast.error("خطا در دانلود گزارش");
    } finally {
      setIsDownloadingEntry(false);
    }
  };

  const handleDownloadVehicles = async () => {
    setIsDownloadingVehicle(true);
    try {
      await managerApi.downloadVehicleReport();
      toast.success("گزارش خودروها دانلود شد");
    } catch {
      toast.error("خطا در دانلود گزارش خودروها");
    } finally {
      setIsDownloadingVehicle(false);
    }
  };

  const pieData = dashboard
    ? [
        { name: "آزاد", value: dashboard.parking_spaces.available },
        { name: "اشغال", value: dashboard.parking_spaces.occupied },
        { name: "مسدود", value: dashboard.parking_spaces.blocked },
      ].filter((item) => item.value > 0)
    : [];

  const topSpaces = dashboard?.top_parking_spaces || [];
  const topUsers = dashboard?.top_users || [];
  const maxSpaceUsage = Math.max(...topSpaces.map((s) => s.usage_count), 1);
  const maxUserCount = Math.max(...topUsers.map((u) => u.request_count), 1);
  const greeting = new Date().getHours() < 12 ? "صبح بخیر" : new Date().getHours() < 18 ? "روز بخیر" : "شب بخیر";

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-600 via-primary-700 to-indigo-900 p-6 text-white shadow-xl sm:p-8">
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

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {user?.full_name || "مدیر عزیز"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              خلاصه وضعیت لحظه‌ای سیستم پارکینگ
            </p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 sm:block">
            <TrendingUp size={32} />
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
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={dashboard.parking_spaces.total}
            icon={<ParkingSquare size={24} />}
            gradient="from-blue-500 to-blue-600"
            shadow="shadow-blue-500/30"
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={dashboard.parking_spaces.available}
            icon={<ParkingSquare size={24} />}
            gradient="from-emerald-500 to-green-600"
            shadow="shadow-emerald-500/30"
          />
          <StatCard
            title="در انتظار بررسی"
            value={dashboard.requests.pending}
            icon={<Users size={24} />}
            gradient="from-amber-500 to-orange-500"
            shadow="shadow-amber-500/30"
          />
          <StatCard
            title="نیازمند بررسی"
            value={dashboard.requests.needs_review}
            icon={<AlertCircle size={24} />}
            gradient="from-rose-500 to-red-600"
            shadow="shadow-rose-500/30"
          />
        </div>
      ) : null}

      {/* 👇 Pie Chart + Top Parking Spaces */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <ParkingSquare size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-bold text-secondary-900">وضعیت کلی جایگاه‌ها</h2>
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

        {/* Top Parking Spaces - Ranked Cards */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <Trophy size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-bold text-secondary-900">پرکاربردترین جایگاه‌ها</h2>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : topSpaces.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-text-secondary">
              هنوز آماری برای جایگاه‌ها ثبت نشده است
            </div>
          ) : (
            <div className="space-y-2">
              {topSpaces.map((space, idx) => {
                const style = getRankStyle(idx);
                const percentage = (space.usage_count / maxSpaceUsage) * 100;
                return (
                  <div
                    key={space.id}
                    className={`group flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${style.cardBg} ${style.border}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.badge}`}
                    >
                      {style.icon || <span className="text-gray-700 dark:text-gray-300">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-secondary-900" dir="ltr">
                            {space.code}
                          </span>
                          {idx < 3 && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              {idx === 0 ? "برترین" : idx === 1 ? "دوم" : "سوم"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-secondary-900">
                          {space.usage_count} <span className="text-text-secondary font-normal">بار</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${style.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 👇 Top Users - Ranked Cards */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
            <Crown size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="font-bold text-secondary-900">فعال‌ترین کاربران</h2>
          <span className="ml-auto text-xs text-text-secondary">Top 5</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-text-secondary">
            هنوز آماری برای کاربران ثبت نشده است
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topUsers.map((u, idx) => {
              const style = getRankStyle(idx);
              const percentage = (u.request_count / maxUserCount) * 100;
              const initial = u.full_name?.charAt(0) || "?";
              const avatarColors = [
                "from-yellow-400 to-amber-600",
                "from-slate-400 to-slate-600",
                "from-orange-400 to-orange-600",
                "from-emerald-400 to-green-600",
                "from-blue-400 to-indigo-600",
              ];

              return (
                <div
                  key={u.id}
                  className={`group relative flex flex-col items-center rounded-xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${style.cardBg} ${style.border}`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}
                  >
                    {style.icon || idx + 1}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white shadow-lg ${avatarColors[idx % avatarColors.length]}`}
                  >
                    {initial}
                  </div>

                  {/* Name */}
                  <p className="mt-3 line-clamp-1 text-sm font-bold text-secondary-900">
                    {u.full_name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-text-secondary" dir="ltr">
                    <Phone size={10} />
                    {u.phone_number}
                  </p>

                  {/* Progress */}
                  <div className="mt-3 w-full">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${style.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-bold text-secondary-900">
                      {u.request_count}
                      <span className="mr-1 font-normal text-text-secondary">درخواست</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 👇 Download Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-bold text-secondary-900">گزارش ورود و خروج</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            دریافت فایل Excel از سوابق تردد خودروها در بازه زمانی مشخص
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="از تاریخ"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="تا تاریخ"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDownloadEntryExit}
              disabled={isDownloadingEntry}
              className="w-full"
            >
              <Download size={18} />
              {isDownloadingEntry ? "در حال دانلود..." : "دریافت گزارش"}
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl" />
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Car size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-bold text-secondary-900">گزارش خودروها</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            لیست کامل تمام خودروهای ثبت‌شده در سیستم
          </p>

          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
            <p className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              شامل اطلاعات مالک، پلاک، نوع و رنگ تمام خودروها
            </p>
          </div>

          <Button
            onClick={handleDownloadVehicles}
            disabled={isDownloadingVehicle}
            variant="outline"
            className="w-full"
          >
            <Download size={18} />
            {isDownloadingVehicle ? "در حال دانلود..." : "دریافت گزارش خودروها"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 👇 Stat Card با طراحی جدید
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

export default ManagerReportsPage;