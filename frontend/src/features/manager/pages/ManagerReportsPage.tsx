// src/features/manager/pages/ManagerReportsPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, Users, ParkingSquare, FileSpreadsheet, Car, AlertCircle, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const COLORS = ["#007aff", "#a1a1aa", "#ff3b30"];

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
      toast.error("تاریخ شروع و پایان را وارد کنید");
      return;
    }
    setIsDownloadingEntry(true);
    try {
      await managerApi.downloadEntryExitReport(startDate, endDate);
      toast.success("گزارش دانلود شد");
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
      toast.error("خطا در دانلود");
    } finally {
      setIsDownloadingVehicle(false);
    }
  };

  const pieData = dashboard
    ? [
        { name: "آزاد", value: dashboard.parking_spaces.available },
        { name: "اشغال", value: dashboard.parking_spaces.occupied },
        { name: "مسدود", value: dashboard.parking_spaces.blocked },
      ].filter((i) => i.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">گزارش‌ها</h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          آمار و تحلیل سیستم پارکینگ
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="کل جایگاه‌ها" value={dashboard.parking_spaces.total} icon={<ParkingSquare size={20} />} />
          <StatCard title="جایگاه آزاد" value={dashboard.parking_spaces.available} icon={<ParkingSquare size={20} />} />
          <StatCard title="در انتظار" value={dashboard.requests.pending} icon={<Users size={20} />} />
          <StatCard title="نیازمند بررسی" value={dashboard.requests.needs_review} icon={<AlertCircle size={20} />} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
            وضعیت جایگاه‌ها
          </h2>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
          ) : pieData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-[13px] text-gray-500">
              اطلاعاتی نیست
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1c1c1e",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Crown size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              پرکاربردترین جایگاه‌ها
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-[#2c2c2e]" />
              ))}
            </div>
          ) : !dashboard?.top_parking_spaces?.length ? (
            <div className="flex h-48 items-center justify-center text-[13px] text-gray-500">
              آماری نیست
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.top_parking_spaces.map((space, idx) => {
                const max = Math.max(...dashboard.top_parking_spaces.map((s) => s.usage_count), 1);
                const percent = (space.usage_count / max) * 100;
                return (
                  <div key={space.id} className="flex items-center gap-3">
                    <span className="w-5 text-[12px] font-medium text-gray-400">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="font-mono text-[12px] font-medium text-gray-900 dark:text-white" dir="ltr">
                          {space.code}
                        </span>
                        <span className="text-[11px] text-gray-500">{space.usage_count} بار</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
                        <div className="h-full rounded-full bg-[#007aff] dark:bg-[#0a84ff]" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            فعال‌ترین کاربران
          </h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
            ))}
          </div>
        ) : !dashboard?.top_users?.length ? (
          <div className="flex h-32 items-center justify-center text-[13px] text-gray-500">
            آماری نیست
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {dashboard.top_users.map((user, idx) => {
              const max = Math.max(...dashboard.top_users.map((u) => u.request_count), 1);
              const percent = (user.request_count / max) * 100;
              return (
                <div key={user.id} className="rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 dark:bg-[#3a3a3c] dark:text-gray-300">
                      {idx + 1}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-[12px] font-semibold text-white dark:bg-[#0a84ff]">
                      {user.full_name?.charAt(0) || "?"}
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[12px] font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500" dir="ltr">
                    {user.phone_number}
                  </p>
                  <div className="mt-2">
                    <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3a3a3c]">
                      <div className="h-full rounded-full bg-[#007aff] dark:bg-[#0a84ff]" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-gray-900 dark:text-white">
                      {user.request_count} <span className="font-normal text-gray-500">درخواست</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              گزارش ورود و خروج
            </h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" label="از" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" label="تا" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleDownloadEntryExit} disabled={isDownloadingEntry} className="w-full">
              <Download size={16} />
              {isDownloadingEntry ? "در حال دانلود..." : "دانلود Excel"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Car size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              گزارش خودروها
            </h2>
          </div>
          <p className="mb-4 text-[13px] text-gray-500 dark:text-gray-400">
            لیست کامل خودروهای ثبت‌شده
          </p>
          <Button onClick={handleDownloadVehicles} disabled={isDownloadingVehicle} variant="outline" className="w-full">
            <Download size={16} />
            {isDownloadingVehicle ? "در حال دانلود..." : "دانلود Excel"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-0.5 text-[22px] font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default ManagerReportsPage;