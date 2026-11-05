// src/features/manager/pages/ManagerReportsPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, Users, ParkingSquare, FileSpreadsheet, Car, AlertCircle, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/shared/PageHeader";

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

  const totalSpaces = dashboard?.parking_spaces.total || 0;
  const availableSpaces = dashboard?.parking_spaces.available || 0;
  const occupiedSpaces = dashboard?.parking_spaces.occupied || 0;
  const blockedSpaces = dashboard?.parking_spaces.blocked || 0;

  const availablePercent = totalSpaces > 0 ? (availableSpaces / totalSpaces) * 100 : 0;
  const occupiedPercent = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;
  const blockedPercent = totalSpaces > 0 ? (blockedSpaces / totalSpaces) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="گزارش‌ها"
        subtitle="آمار و تحلیل سیستم پارکینگ"
      />

      {/* Stat Cards */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]"
            />
          ))}
        </div>
      ) : dashboard ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={totalSpaces}
            icon={<ParkingSquare size={20} />}
          />
          <StatCard
            title="جایگاه آزاد"
            value={availableSpaces}
            icon={<ParkingSquare size={20} />}
          />
          <StatCard
            title="در انتظار"
            value={dashboard.requests.pending}
            icon={<Users size={20} />}
          />
          <StatCard
            title="نیازمند بررسی"
            value={dashboard.requests.needs_review}
            icon={<AlertCircle size={20} />}
          />
        </div>
      ) : null}

      {/* Occupancy Overview - Minimal Progress Bars */}
      <div className="mb-6 rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="mb-1 text-[15px] font-semibold text-gray-900 dark:text-white">
          وضعیت جایگاه‌ها
        </h2>
        <p className="mb-5 text-[12px] text-gray-500 dark:text-gray-400">
          {totalSpaces} جایگاه در سیستم
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-[#2c2c2e]"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <StatusRow
              label="آزاد"
              value={availableSpaces}
              total={totalSpaces}
              percent={availablePercent}
              color="bg-[#34c759] dark:bg-[#30d158]"
            />
            <StatusRow
              label="اشغال"
              value={occupiedSpaces}
              total={totalSpaces}
              percent={occupiedPercent}
              color="bg-[#007aff] dark:bg-[#0a84ff]"
            />
            <StatusRow
              label="مسدود"
              value={blockedSpaces}
              total={totalSpaces}
              percent={blockedPercent}
              color="bg-[#ff3b30] dark:bg-[#ff453a]"
            />
          </div>
        )}
      </div>

      {/* Two columns: Top parking + Top users */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top parking */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Crown size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              پرکاربردترین جایگاه‌ها
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded-lg bg-gray-100 dark:bg-[#2c2c2e]"
                />
              ))}
            </div>
          ) : !dashboard?.top_parking_spaces?.length ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-gray-500">
              آماری نیست
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.top_parking_spaces.map((space, idx) => {
                const max = Math.max(
                  ...dashboard.top_parking_spaces.map((s) => s.usage_count),
                  1
                );
                const percent = (space.usage_count / max) * 100;
                return (
                  <div key={space.id} className="flex items-center gap-3">
                    <span className="w-4 text-[12px] font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className="truncate font-mono text-[12px] font-medium text-gray-900 dark:text-white"
                          dir="ltr"
                        >
                          {space.code}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-500">
                          {space.usage_count} بار
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
                        <div
                          className="h-full rounded-full bg-[#007aff] dark:bg-[#0a84ff]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top users */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              فعال‌ترین کاربران
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded-lg bg-gray-100 dark:bg-[#2c2c2e]"
                />
              ))}
            </div>
          ) : !dashboard?.top_users?.length ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-gray-500">
              آماری نیست
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.top_users.map((user, idx) => {
                const max = Math.max(
                  ...dashboard.top_users.map((u) => u.request_count),
                  1
                );
                const percent = (user.request_count / max) * 100;
                return (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="w-4 text-[12px] font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-500">
                          {user.request_count} درخواست
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
                        <div
                          className="h-full rounded-full bg-[#007aff] dark:bg-[#0a84ff]"
                          style={{ width: `${percent}%` }}
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

      {/* Downloads */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              گزارش ورود و خروج
            </h2>
          </div>
          <p className="mb-4 text-[13px] text-gray-500 dark:text-gray-400">
            فایل Excel از سوابق تردد
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                label="از"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="تا"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDownloadEntryExit}
              disabled={isDownloadingEntry}
              className="w-full"
            >
              <Download size={16} />
              {isDownloadingEntry ? "در حال دانلود..." : "دانلود Excel"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Car size={16} className="text-gray-700 dark:text-gray-300" />
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              گزارش خودروها
            </h2>
          </div>
          <p className="mb-4 text-[13px] text-gray-500 dark:text-gray-400">
            لیست کامل خودروهای ثبت‌شده
          </p>
          <Button
            onClick={handleDownloadVehicles}
            disabled={isDownloadingVehicle}
            variant="outline"
            className="w-full"
          >
            <Download size={16} />
            {isDownloadingVehicle ? "در حال دانلود..." : "دانلود Excel"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Stat Card
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-0.5 text-[22px] font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

// Status Row - Progress Bar
function StatusRow({
  label,
  value,
  total,
  percent,
  color,
}: {
  label: string;
  value: number;
  total: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          <span className="text-[13px] font-medium text-gray-900 dark:text-white">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-[11px] text-gray-500">/ {total}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ManagerReportsPage;