// src/features/dashboard/GuardDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare, Car, CheckCircle, Clock, LogIn, ArrowLeft, AlertCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { guardApi } from "../guard/api";
import { useAuth } from "../auth/AuthContext";

const COLORS = ["#007aff", "#a1a1aa", "#ff3b30"];

function GuardDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["guard-dashboard"],
    queryFn: guardApi.getDashboard,
    refetchInterval: 30000,
  });

  const { data: logs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  const activeLogs = logs?.filter((log) => !log.exit_time) || [];

  const pieData = data
    ? [
        { name: "آزاد", value: data.parking_spaces.available },
        { name: "اشغال", value: data.parking_spaces.occupied },
        { name: "مسدود", value: data.parking_spaces.blocked },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          سلام، {user?.full_name?.split(" ")[0] || "نگهبان"} 👋
        </h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          وضعیت لحظه‌ای پارکینگ
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
          <StatCard title="کل جایگاه‌ها" value={data.parking_spaces.total} icon={<ParkingSquare size={20} />} />
          <StatCard title="جایگاه آزاد" value={data.parking_spaces.available} icon={<CheckCircle size={20} />} />
          <StatCard title="در حال استفاده" value={data.vehicles.in_use} icon={<Car size={20} />} />
          <StatCard title="منتظر ورود" value={data.requests.approved} icon={<Clock size={20} />} />
        </div>
      ) : null}

      {/* Alerts */}
      {data && (data.requests.approved > 0 || data.vehicles.in_use > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.requests.approved > 0 && (
            <button
              onClick={() => navigate("/entry-exit")}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 text-right shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                  {data.requests.approved} منتظر ورود
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">آماده ثبت ورود</p>
              </div>
              <ArrowLeft size={16} className="text-gray-400" />
            </button>
          )}
          {data.vehicles.in_use > 0 && (
            <button
              onClick={() => navigate("/entry-exit")}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 text-right shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                <Car size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                  {data.vehicles.in_use} داخل پارکینگ
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">هنگام خروج ثبت کنید</p>
              </div>
              <ArrowLeft size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900 dark:text-white">
            وضعیت جایگاه‌ها
          </h2>
          {pieData.length === 0 ? (
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              داخل پارکینگ
            </h2>
            <button
              onClick={() => navigate("/entry-exit")}
              className="flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
            >
              <LogIn size={12} />
              ثبت تردد
            </button>
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
                <div key={log.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]">
                  <div>
                    <p className="font-mono text-[13px] font-medium text-gray-900 dark:text-white" dir="ltr">
                      {log.vehicle_detail?.plate_number}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500" dir="ltr">
                      {new Date(log.entry_time).toLocaleTimeString("fa-IR")}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
                    داخل
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

export default GuardDashboard;