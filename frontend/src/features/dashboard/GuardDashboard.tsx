// src/features/dashboard/GuardDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare, Car, CheckCircle, Clock, ShieldAlert,
  ArrowLeft, LogIn
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { guardApi } from "../guard/api";
import Button from "../../components/ui/Button";

const COLORS = ["#16a34a", "#3b82f6", "#dc2626"]; // سبز (آزاد)، آبی (اشغال)، قرمز (مسدود)

function GuardDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["guard-dashboard"],
    queryFn: guardApi.getDashboard,
    refetchInterval: 30000, // هر ۳۰ ثانیه آمار به‌روز بشه
  });

  if (isLoading) return <div className="p-4">در حال بارگذاری...</div>;
  if (!data) return <div className="p-4 text-danger">خطا در دریافت اطلاعات</div>;

  // آماده‌سازی داده برای نمودار دایره‌ای
  const pieData = [
    { name: "آزاد", value: data.parking_spaces.available },
    { name: "اشغال", value: data.parking_spaces.occupied },
    { name: "مسدود", value: data.parking_spaces.blocked },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* هدر خوش‌آمدگویی */}
      <div className="rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 p-6 text-white shadow-sm">
        <h1 className="text-xl font-bold">داشبورد نگهبان</h1>
        <p className="mt-2 text-sm opacity-90">
          خوش آمدید! در اینجا می‌توانید وضعیت لحظه‌ای پارکینگ را مشاهده کنید.
        </p>
      </div>

      {/* کارت‌های آماری اصلی */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="کل جایگاه‌ها"
          value={data.parking_spaces.total}
          icon={<ParkingSquare size={24} />}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="جایگاه‌های آزاد"
          value={data.parking_spaces.available}
          icon={<CheckCircle size={24} />}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="در حال استفاده"
          value={data.vehicles.in_use}
          icon={<Car size={24} />}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="منتظر ورود"
          value={data.requests.approved}
          icon={<Clock size={24} />}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* نمودار وضعیت پارکینگ */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">وضعیت جایگاه‌ها</h2>
          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-text-secondary">
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

        {/* پنل اکشن‌های سریع */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-secondary-900">عملیات سریع</h2>
          <div className="space-y-3">
            <ActionCard
              title="ثبت ورود و خروج"
              description="جستجوی پلاک و ثبت تردد خودروها"
              icon={<LogIn size={22} />}
              color="bg-green-100 text-green-600"
              onClick={() => navigate("/entry-exit")}
            />

            {data.requests.approved > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <ShieldAlert size={22} className="text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800">
                    {data.requests.approved} درخواست منتظر ورود
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    این درخواست‌ها تایید شده‌اند و آماده ثبت ورود هستند.
                  </p>
                </div>
              </div>
            )}

            {data.vehicles.in_use > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 border border-blue-200">
                <Car size={22} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">
                    {data.vehicles.in_use} خودرو داخل پارکینگ
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    فراموش نکنید هنگام خروج، تردد را ثبت کنید.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- کامپوننت کارت آماری ---
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
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

// --- کامپوننت کارت اکشن ---
function ActionCard({
  title, description, icon, color, onClick
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-right transition-colors hover:bg-background"
    >
      <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-secondary-900">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <ArrowLeft size={18} className="text-text-secondary" />
    </button>
  );
}

export default GuardDashboard;