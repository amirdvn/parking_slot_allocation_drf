// src/features/dashboard/ManagerDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare, Users, Clock, CheckCircle, ClipboardList, ArrowLeft,
  FileBarChart, TrendingUp, AlertCircle,
} from "lucide-react";
import { managerApi } from "../manager/api";
import { useAuth } from "../auth/AuthContext";
import { formatSpaceCode, formatPlate } from "../../lib/parking-format";

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار",
  NEEDS_REVIEW: "نیازمند بررسی",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
  IN_USE: "در حال استفاده",
  COMPLETED: "تکمیل شده",
  CANCELED: "لغو شده",
};

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: dashboard, isLoading: isLoadingDash } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
    refetchInterval: 60000,
  });

  const { data: pendingRequests, isLoading: isLoadingPending } = useQuery({
    queryKey: ["manager-requests", "needs_review"],
    queryFn: managerApi.getNeedsReviewRequests,
    refetchInterval: 60000,
  });

  const { data: approvedRequests, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["manager-requests", "approved"],
    queryFn: managerApi.getApprovedRequests,
    refetchInterval: 60000,
  });

  const latestPending = pendingRequests?.slice(0, 3) || [];
  const latestApproved = approvedRequests?.slice(0, 3) || [];

  const totalPending =
    (dashboard?.requests.pending || 0) + (dashboard?.requests.needs_review || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          سلام، {user?.full_name?.split(" ")[0] || "مدیر"} 👋
        </h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          {totalPending > 0
            ? `${totalPending} درخواست در انتظار بررسی شماست`
            : "همه درخواست‌ها بررسی شده‌اند"}
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
            onClick={() => navigate("/parking")}
          />
          <StatCard
            title="جایگاه‌های آزاد"
            value={dashboard.parking_spaces.available}
            icon={<CheckCircle size={20} />}
            onClick={() => navigate("/parking")}
          />
          <StatCard
            title="در انتظار بررسی"
            value={dashboard.requests.pending}
            icon={<Clock size={20} />}
            onClick={() => navigate("/manage-requests")}
          />
          <StatCard
            title="نیازمند بررسی"
            value={dashboard.requests.needs_review}
            icon={<AlertCircle size={20} />}
            onClick={() => navigate("/manage-requests")}
          />
        </div>
      ) : null}

      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
          دسترسی سریع
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction
            icon={<ClipboardList size={20} />}
            title="درخواست‌ها"
            onClick={() => navigate("/manage-requests")}
          />
          <QuickAction
            icon={<ParkingSquare size={20} />}
            title="پارکینگ"
            onClick={() => navigate("/parking")}
          />
          <QuickAction
            icon={<Users size={20} />}
            title="کاربران"
            onClick={() => navigate("/users")}
          />
          <QuickAction
            icon={<FileBarChart size={20} />}
            title="گزارش‌ها"
            onClick={() => navigate("/reports")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              در انتظار بررسی
            </h2>
            {latestPending.length > 0 && (
              <button
                onClick={() => navigate("/manage-requests")}
                className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                مشاهده همه
                <ArrowLeft size={12} />
              </button>
            )}
          </div>

          {isLoadingPending ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
              ))}
            </div>
          ) : latestPending.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                <CheckCircle size={24} />
              </div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                همه بررسی شده
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">عالی!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {latestPending.map((req) => (
                <button
                  key={req.id}
                  onClick={() => navigate("/manage-requests")}
                  className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-3 text-right transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-gray-900 dark:text-white">
                      {req.user_detail?.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {formatPlate(req.vehicle_detail?.plate_number)} · {formatSpaceCode(req.parking_space_detail?.code)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-[#3a3a3c] dark:text-gray-300">
                    #{req.id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              فعالیت اخیر
            </h2>
            {latestApproved.length > 0 && (
              <button
                onClick={() => navigate("/reports")}
                className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                گزارش
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
          ) : latestApproved.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
                <TrendingUp size={24} />
              </div>
              <p className="text-[13px] text-gray-500">فعالیتی ثبت نشده</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {latestApproved.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-gray-900 dark:text-white">
                      {req.user_detail?.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {formatPlate(req.vehicle_detail?.plate_number)} · {formatSpaceCode(req.parking_space_detail?.code)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                    {statusLabels[req.status] || req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {dashboard && (
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
            وضعیت اشغال
          </h2>
          <div className="space-y-3">
            <OccupancyBar
              label="آزاد"
              value={dashboard.parking_spaces.available}
              total={dashboard.parking_spaces.total}
              color="bg-[#34c759] dark:bg-[#30d158]"
            />
            <OccupancyBar
              label="اشغال"
              value={dashboard.parking_spaces.occupied}
              total={dashboard.parking_spaces.total}
              color="bg-[#007aff] dark:bg-[#0a84ff]"
            />
            <OccupancyBar
              label="مسدود"
              value={dashboard.parking_spaces.blocked}
              total={dashboard.parking_spaces.total}
              color="bg-[#ff3b30] dark:bg-[#ff453a]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-2xl bg-surface p-4 text-right shadow-sm transition-shadow hover:shadow-md"
    >
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

function QuickAction({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]"
    >
      <div className="text-[#007aff] dark:text-[#0a84ff]">{icon}</div>
      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{title}</span>
    </button>
  );
}

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
      <div className="mb-1.5 flex justify-between text-[12px]">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white">
          <span className="font-semibold">{value}</span>
          <span className="text-gray-400"> / {total}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#2c2c2e]">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ManagerDashboard;