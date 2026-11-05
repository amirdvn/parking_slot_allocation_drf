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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Download,
  Users,
  ParkingSquare,
  FileSpreadsheet,
  Car,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

const COLORS = ["#16a34a", "#3b82f6", "#dc2626"]; // سبز، آبی، قرمز

// تاریخ پیش‌فرض: ۷ روز پیش و امروز
const getDefaultDates = () => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  return {
    start: weekAgo.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
};

function ManagerReportsPage() {
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
      toast.error("خطا در دانلود گزارش. ممکن است در این بازه اطلاعاتی وجود نداشته باشد.");
    } finally {
      setIsDownloadingEntry(false);
    }
  };

  const handleDownloadVehicles = async () => {
    setIsDownloadingVehicle(true);
    try {
      await managerApi.downloadVehicleReport();
      toast.success("گزارش خودروها با موفقیت دانلود شد");
    } catch {
      toast.error("خطا در دانلود گزارش خودروها");
    } finally {
      setIsDownloadingVehicle(false);
    }
  };

  // آماده‌سازی داده برای نمودار دایره‌ای
  const pieData = dashboard
    ? [
        { name: "آزاد", value: dashboard.parking_spaces.available },
        { name: "اشغال", value: dashboard.parking_spaces.occupied },
        { name: "مسدود", value: dashboard.parking_spaces.blocked },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-secondary-900">گزارش‌ها و آمار</h1>

      {/* کارت‌های آمار کلی */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={dashboard.parking_spaces.total}
            icon={<ParkingSquare size={24} />}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={dashboard.parking_spaces.available}
            icon={<ParkingSquare size={24} />}
            color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatCard
            title="درخواست‌های منتظر"
            value={dashboard.requests.pending}
            icon={<Users size={24} />}
            color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
          />
          <StatCard
            title="نیازمند بررسی"
            value={dashboard.requests.needs_review}
            icon={<AlertCircle size={24} />}
            color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          />
        </div>
      ) : null}

      {/* نمودارها */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* نمودار وضعیت پارکینگ */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">وضعیت کلی جایگاه‌ها</h2>
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
                    outerRadius={80}
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

        {/* نمودار پرکاربردترین جایگاه‌ها */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">پرکاربردترین جایگاه‌ها (Top 5)</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !dashboard?.top_parking_spaces || dashboard.top_parking_spaces.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
              هنوز آماری برای جایگاه‌ها ثبت نشده است
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboard.top_parking_spaces}
                  layout="vertical"
                  margin={{ right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={80} />
                  <RechartsTooltip formatter={(value) => [`${value} بار`, "استفاده"]} />
                  <Bar dataKey="usage_count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* نمودار برترین کاربران */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-emerald-600" />
          <h2 className="font-bold text-secondary-900">فعال‌ترین کاربران (Top 5)</h2>
        </div>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !dashboard?.top_users || dashboard.top_users.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
            هنوز آماری برای کاربران ثبت نشده است
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboard.top_users}
                layout="vertical"
                margin={{ right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="full_name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  formatter={(value) => [`${value} درخواست`, "تعداد"]}
                  labelFormatter={(label) => {
                    const user = dashboard.top_users.find((u) => u.full_name === label);
                    return user ? `${user.full_name} (${user.phone_number})` : label;
                  }}
                />
                <Bar dataKey="request_count" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* بخش دانلود گزارش‌ها */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* گزارش ورود و خروج */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" />
            <h2 className="font-bold text-secondary-900">گزارش ورود و خروج (Excel)</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            برای دریافت گزارش، بازه زمانی مورد نظر را وارد کنید.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="تاریخ شروع"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="تاریخ پایان"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDownloadEntryExit}
              disabled={isDownloadingEntry}
              className="w-full gap-2"
            >
              <Download size={18} />
              {isDownloadingEntry ? "در حال دانلود..." : "دریافت گزارش"}
            </Button>
          </div>
        </div>

        {/* گزارش خودروها */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Car className="text-blue-600" />
            <h2 className="font-bold text-secondary-900">گزارش خودروها (Excel)</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            لیست کامل تمام خودروهای ثبت‌شده در سیستم را دریافت کنید.
          </p>
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 mb-4">
            <p className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              این گزارش شامل تمام خودروها (فعال و غیرفعال) با اطلاعات مالک است.
            </p>
          </div>
          <Button
            onClick={handleDownloadVehicles}
            disabled={isDownloadingVehicle}
            variant="outline"
            className="w-full gap-2"
          >
            <Download size={18} />
            {isDownloadingVehicle ? "در حال دانلود..." : "دریافت گزارش خودروها"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// کامپوننت کوچک کارت آمار
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-secondary-900">{value}</p>
      </div>
    </div>
  );
}

export default ManagerReportsPage;