// src/features/dashboard/UserDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Car, ClipboardList, CheckCircle, Clock, Plus, ArrowLeft, UserPlus,
} from "lucide-react";
import { parkingApi } from "../parking/api";
import { useAuth } from "../auth/AuthContext";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "در انتظار", className: "bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300" },
  APPROVED: { label: "تایید شده", className: "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]" },
  REJECTED: { label: "رد شده", className: "bg-red-50 text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]" },
  IN_USE: { label: "در حال استفاده", className: "bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]" },
  COMPLETED: { label: "تکمیل شده", className: "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]" },
  CANCELED: { label: "لغو شده", className: "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500" },
};

function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: parkingApi.getUserDashboard,
  });

  const { data: requests } = useQuery({
    queryKey: ["parking-requests"],
    queryFn: parkingApi.getMyRequests,
  });

  const latestRequests = requests?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          سلام، {user?.full_name?.split(" ")[0] || "کاربر"} 👋
        </h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          به داشبورد خود خوش آمدید
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="کل خودروها" value={data.vehicles.total} icon={<Car size={20} />} onClick={() => navigate("/vehicles")} />
          <StatCard title="خودروهای فعال" value={data.vehicles.active} icon={<CheckCircle size={20} />} onClick={() => navigate("/vehicles")} />
          <StatCard title="در انتظار" value={data.requests.pending} icon={<Clock size={20} />} onClick={() => navigate("/requests")} />
          <StatCard title="تایید شده" value={data.requests.approved} icon={<ClipboardList size={20} />} onClick={() => navigate("/requests")} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
            دسترسی سریع
          </h2>
          <div className="space-y-1.5">
            <QuickAction
              icon={<Plus size={18} />}
              title="ثبت خودرو جدید"
              description="خودروی خود را ثبت کنید"
              onClick={() => navigate("/vehicles")}
            />
            <QuickAction
              icon={<ClipboardList size={18} />}
              title="ثبت درخواست"
              description="درخواست جایگاه پارکینگ"
              onClick={() => navigate("/requests")}
            />
            <QuickAction
              icon={<UserPlus size={18} />}
              title="درخواست مهمان"
              description="ثبت برای مهمانان"
              onClick={() => navigate("/guest-request")}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              آخرین درخواست‌ها
            </h2>
            {latestRequests.length > 0 && (
              <button
                onClick={() => navigate("/requests")}
                className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                همه
                <ArrowLeft size={12} />
              </button>
            )}
          </div>

          {latestRequests.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
                <ClipboardList size={24} />
              </div>
              <p className="text-[13px] text-gray-500">هنوز درخواستی ندارید</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {latestRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]"
                >
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                      درخواست #{req.id}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500" dir="ltr">
                      {new Date(req.start_time).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMap[req.status]?.className || ""}`}>
                    {statusMap[req.status]?.label || req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, onClick }: { title: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
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

function QuickAction({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-right transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-500">{description}</p>
      </div>
      <ArrowLeft size={16} className="shrink-0 text-gray-400 transition-transform group-hover:-translate-x-1" />
    </button>
  );
}

export default UserDashboard;