// src/features/dashboard/GuardDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare, Car, CheckCircle, Clock, LogIn, ArrowLeft, TrendingUp,
} from "lucide-react";
import { guardApi } from "../guard/api";
import { useAuth } from "../auth/AuthContext";
import { formatSpaceCode, formatPlate } from "../../lib/parking-format";

function GuardDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: dashboard, isLoading: isLoadingDash } = useQuery({
    queryKey: ["guard-dashboard"],
    queryFn: guardApi.getDashboard,
    refetchInterval: 30000,
  });

  const { data: approvedRequests, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["guard-approved-requests"],
    queryFn: guardApi.getApprovedRequests,
    refetchInterval: 30000,
  });

  const { data: logs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  const activeLogs = logs?.filter((log) => !log.exit_time) || [];

  const now = new Date();
  const readyNow = approvedRequests?.filter((req: any) => {
    const start = new Date(req.start_time);
    const end = new Date(req.end_time);
    return now >= start && now <= end;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          سلام، {user?.full_name?.split(" ")[0] || "نگهبان"} 👋
        </h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          {readyNow.length > 0
            ? `${readyNow.length} درخواست آماده ورود به پارکینگ است`
            : "وضعیت پارکینگ در این لحظه"}
        </p>
      </div>

      {isLoadingDash ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="کل جایگاه‌ها"
            value={dashboard.parking_spaces.total}
            icon={<ParkingSquare size={20} />}
            onClick={() => navigate("/entry-exit")}
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={dashboard.parking_spaces.available}
            icon={<CheckCircle size={20} />}
            onClick={() => navigate("/entry-exit")}
          />
          <StatCard
            title="در حال استفاده"
            value={dashboard.parking_spaces.occupied}
            icon={<TrendingUp size={20} />}
            onClick={() => navigate("/entry-exit")}
          />
          <StatCard
            title="آماده ورود"
            value={readyNow.length}
            icon={<Clock size={20} />}
            onClick={() => navigate("/entry-exit")}
          />
        </div>
      ) : null}

      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
          دسترسی سریع
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction
            icon={<LogIn size={20} />}
            title="ثبت تردد"
            onClick={() => navigate("/entry-exit")}
          />
          <QuickAction
            icon={<Car size={20} />}
            title="جستجوی پلاک"
            onClick={() => navigate("/entry-exit")}
          />
          <QuickAction
            icon={<Clock size={20} />}
            title="آماده ورود"
            onClick={() => navigate("/entry-exit")}
          />
          <QuickAction
            icon={<CheckCircle size={20} />}
            title="داخل پارکینگ"
            onClick={() => navigate("/entry-exit")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              آماده ورود
            </h2>
            {readyNow.length > 0 && (
              <button
                onClick={() => navigate("/entry-exit")}
                className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                مشاهده همه
                <ArrowLeft size={12} />
              </button>
            )}
          </div>

          {isLoadingApproved ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
              ))}
            </div>
          ) : readyNow.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                <CheckCircle size={24} />
              </div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                درخواستی در انتظار نیست
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {readyNow.slice(0, 3).map((req: any) => (
                <button
                  key={req.id}
                  onClick={() => navigate("/entry-exit")}
                  className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-3 text-right transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-gray-900 dark:text-white">
                      {formatPlate(req.vehicle_detail?.plate_number, req.vehicle_detail?.vehicle_type)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      جایگاه {formatSpaceCode(req.parking_space_detail?.code)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
                    آماده
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              داخل پارکینگ
            </h2>
            {activeLogs.length > 0 && (
              <button
                onClick={() => navigate("/entry-exit")}
                className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                ثبت تردد
                <ArrowLeft size={12} />
              </button>
            )}
          </div>

          {activeLogs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
                <Car size={24} />
              </div>
              <p className="text-[13px] text-gray-500">خودرویی داخل نیست</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[13px] font-medium text-gray-900 dark:text-white">
                      {formatPlate(log.vehicle_detail?.plate_number, log.vehicle_detail?.vehicle_type)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500" dir="ltr">
                      ورود: {new Date(log.entry_time).toLocaleTimeString("fa-IR")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                    داخل
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 👇 بخش جدید: گزارش وضعیت اشغال (دقیقاً مثل مدیر) */}
      {dashboard && (
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
            وضعیت اشغال
          </h2>
          <div className="space-y-3">
            <OccupancyBar label="آزاد" value={dashboard.parking_spaces.available} total={dashboard.parking_spaces.total} color="bg-[#34c759] dark:bg-[#30d158]" />
            <OccupancyBar label="اشغال" value={dashboard.parking_spaces.occupied} total={dashboard.parking_spaces.total} color="bg-[#007aff] dark:bg-[#0a84ff]" />
            <OccupancyBar label="مسدود" value={dashboard.parking_spaces.blocked} total={dashboard.parking_spaces.total} color="bg-[#ff3b30] dark:bg-[#ff453a]" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, onClick }: { title: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col gap-3 rounded-2xl bg-surface p-4 text-right shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-0.5 text-[22px] font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </button>
  );
}

function QuickAction({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]">
      <div className="text-[#007aff] dark:text-[#0a84ff]">{icon}</div>
      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{title}</span>
    </button>
  );
}

// 👇 کامپوننت جدید اضافه شده
function OccupancyBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[12px]">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white">
          <span className="font-semibold">{value}</span>
          <span className="text-gray-400"> / {total}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default GuardDashboard;