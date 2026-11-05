import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Car,
  ClipboardList,
  CheckCircle,
  Clock,
  Plus,
  ArrowLeft,
  UserPlus,
  TrendingUp,
  Calendar,
  ParkingSquare,
} from "lucide-react";
import { parkingApi } from "../parking/api";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";

// مپر وضعیت
const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "در انتظار",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  APPROVED: {
    label: "تایید شده",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  REJECTED: {
    label: "رد شده",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  CANCELED: {
    label: "لغو شده",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  IN_USE: {
    label: "در حال استفاده",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  COMPLETED: {
    label: "تکمیل شده",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: parkingApi.getUserDashboard,
  });

  const { data: recentRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["parking-requests"],
    queryFn: parkingApi.getMyRequests,
  });

  // ۳ درخواست آخر
  const latestRequests = recentRequests?.slice(0, 3) || [];

  const greeting =
    new Date().getHours() < 12
      ? "صبح بخیر"
      : new Date().getHours() < 18
        ? "روز بخیر"
        : "شب بخیر";

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-600 via-teal-600 to-primary-700 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {user?.full_name || "کاربر عزیز"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              به پنل کاربری خود خوش آمدید
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
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="کل خودروها"
            value={data.vehicles.total}
            icon={<Car size={24} />}
            gradient="from-blue-500 to-blue-600"
            shadow="shadow-blue-500/30"
            onClick={() => navigate("/vehicles")}
          />
          <StatCard
            title="خودروهای فعال"
            value={data.vehicles.active}
            icon={<CheckCircle size={24} />}
            gradient="from-emerald-500 to-green-600"
            shadow="shadow-emerald-500/30"
            onClick={() => navigate("/vehicles")}
          />
          <StatCard
            title="در انتظار بررسی"
            value={data.requests.pending}
            icon={<Clock size={24} />}
            gradient="from-amber-500 to-orange-500"
            shadow="shadow-amber-500/30"
            onClick={() => navigate("/requests")}
          />
          <StatCard
            title="تایید شده"
            value={data.requests.approved}
            icon={<ClipboardList size={24} />}
            gradient="from-purple-500 to-indigo-600"
            shadow="shadow-purple-500/30"
            onClick={() => navigate("/requests")}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 👇 Quick Actions */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-bold text-secondary-900">عملیات سریع</h2>
          </div>

          <div className="space-y-2">
            <QuickAction
              icon={<Plus size={20} />}
              title="ثبت خودرو جدید"
              description="برای شروع استفاده از پارکینگ، خودروی خود را ثبت کنید"
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              onClick={() => navigate("/vehicles")}
            />
            <QuickAction
              icon={<ClipboardList size={20} />}
              title="ثبت درخواست پارکینگ"
              description="رزرو جایگاه پارکینگ برای بازه زمانی مشخص"
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              onClick={() => navigate("/requests")}
            />
            <QuickAction
              icon={<UserPlus size={20} />}
              title="درخواست مهمان"
              description="ثبت درخواست پارکینگ برای مهمانان"
              color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              onClick={() => navigate("/guest-request")}
            />
          </div>
        </div>

        {/* 👇 Recent Requests */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                <Calendar size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-bold text-secondary-900">آخرین درخواست‌ها</h2>
            </div>
            <button
              onClick={() => navigate("/requests")}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              مشاهده همه
              <ArrowLeft size={14} />
            </button>
          </div>

          {isLoadingRequests ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : latestRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-background p-4 text-text-secondary">
                <ParkingSquare size={40} />
              </div>
              <p className="mt-3 text-sm font-medium text-secondary-900">
                هنوز درخواستی ثبت نکرده‌اید
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                اولین درخواست پارکینگ خود را ثبت کنید
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/requests")}
              >
                <Plus size={16} />
                ثبت درخواست
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {latestRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => navigate("/requests")}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background/50 p-3 transition-all hover:bg-background hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-secondary-900">
                      درخواست #{req.id}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary" dir="ltr">
                      {new Date(req.start_time).toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                      statusMap[req.status]?.color || "bg-gray-100"
                    }`}
                  >
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

// 👇 Stat Card
function StatCard({
  title,
  value,
  icon,
  gradient,
  shadow,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 text-right shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${gradient} ${shadow} transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <p className="text-xs text-text-secondary">{title}</p>
      <p className="mt-1 text-2xl font-bold text-secondary-900">{value}</p>
    </button>
  );
}

// 👇 Quick Action
function QuickAction({
  icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-right transition-all hover:bg-background hover:shadow-sm"
    >
      <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-secondary-900">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
          {description}
        </p>
      </div>
      <ArrowLeft
        size={18}
        className="shrink-0 text-text-secondary transition-transform group-hover:-translate-x-1"
      />
    </button>
  );
}

export default UserDashboard;