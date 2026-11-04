import { useQuery } from "@tanstack/react-query";
import { Car, ClipboardList, CheckCircle, Clock } from "lucide-react";
import { parkingApi } from "../parking/api";

function UserDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: parkingApi.getUserDashboard,
  });

  if (isLoading) return <div className="p-4">در حال بارگذاری...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-secondary-900">داشبورد من</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600"><Car size={24} /></div>
          <div>
            <p className="text-sm text-text-secondary">کل خودروها</p>
            <p className="text-2xl font-bold">{data.vehicles.total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-green-100 p-3 text-green-600"><Car size={24} /></div>
          <div>
            <p className="text-sm text-text-secondary">خودروهای فعال</p>
            <p className="text-2xl font-bold">{data.vehicles.active}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-text-secondary">در انتظار بررسی</p>
            <p className="text-2xl font-bold">{data.requests.pending}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-center gap-4">
          <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-text-secondary">تایید شده</p>
            <p className="text-2xl font-bold">{data.requests.approved}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;