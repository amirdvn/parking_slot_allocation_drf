// src/features/manager/pages/ManagerReportsPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerApi } from "../api";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Download, Users, ParkingSquare, FileSpreadsheet } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

// رنگ‌های نمودار
const COLORS = ["#3b82f6", "#16a34a", "#d97706", "#dc2626"]; // آبی، سبز، زرد، قرمز

function ManagerReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // دریافت داده‌های داشبورد
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
  });

  const handleDownloadReport = async () => {
    if (!startDate || !endDate) {
      alert("لطفاً تاریخ شروع و پایان را وارد کنید");
      return;
    }
    setIsDownloading(true);
    try {
      await managerApi.downloadEntryExitReport(startDate, endDate);
    } catch (error) {
      alert("خطا در دانلود گزارش. ممکن است در این بازه اطلاعاتی وجود نداشته باشد.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <div className="p-4">در حال بارگذاری آمار...</div>;
  if (!dashboard) return <div className="p-4 text-danger">خطا در دریافت اطلاعات</div>;

  // آماده‌سازی داده‌ها برای نمودار دایره‌ای (وضعیت پارکینگ)
  const pieData = [
    { name: "آزاد", value: dashboard.parking_spaces.available },
    { name: "اشغال", value: dashboard.parking_spaces.occupied },
    { name: "مسدود", value: dashboard.parking_spaces.blocked },
  ].filter(item => item.value > 0); // فقط مواردی که مقدار دارن

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-secondary-900">گزارش‌ها و آمار</h1>

      {/* کارت‌های آمار کلی */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="کل جایگاه‌ها" value={dashboard.parking_spaces.total} icon={<ParkingSquare />} color="text-primary-600" />
        <StatCard title="جایگاه‌های آزاد" value={dashboard.parking_spaces.available} icon={<ParkingSquare />} color="text-green-600" />
        <StatCard title="درخواست‌های منتظر" value={dashboard.requests.pending} icon={<Users />} color="text-yellow-600" />
        <StatCard title="نیازمند بررسی" value={dashboard.requests.needs_review} icon={<Users />} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* نمودار وضعیت پارکینگ */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">وضعیت کلی جایگاه‌ها</h2>
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
        </div>

        {/* نمودار پرکاربردترین جایگاه‌ها */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">پرکاربردترین جایگاه‌ها (Top 5)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.top_parking_spaces} layout="vertical" margin={{ right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="code" type="category" width={80} />
                <RechartsTooltip formatter={(value) => [`${value} بار`, "استفاده"]} />
                <Bar dataKey="usage_count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* بخش دانلود گزارش اکسل */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="text-green-600" />
          <h2 className="font-bold text-secondary-900">دانلود گزارش ورود و خروج (Excel)</h2>
        </div>
        <p className="mb-4 text-sm text-text-secondary">
          برای دریافت گزارش، بازه زمانی مورد نظر را وارد کنید.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
          <Button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="gap-2 sm:w-48"
          >
            <Download size={18} />
            {isDownloading ? "در حال دانلود..." : "دریافت گزارش"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// کامپوننت کوچک کارت آمار
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className={`rounded-lg bg-background p-3 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-secondary-900">{value}</p>
      </div>
    </div>
  );
}

export default ManagerReportsPage;