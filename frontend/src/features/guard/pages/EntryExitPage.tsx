// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  LogIn,
  LogOut,
  Car,
  MapPin,
  Calendar,
  ShieldCheck,
  ScanLine,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { guardApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import { TableSkeleton } from "../../../components/ui/Skeleton";

function EntryExitPage() {
  const queryClient = useQueryClient();
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState<number | null>(null);

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  const activeLogs = logs?.filter((log) => !log.exit_time) || [];

  const searchMutation = useMutation({
    mutationFn: guardApi.searchVehicle,
    onSuccess: (data) => {
      setSearchResult(data);
      if (!data || data.length === 0) {
        setSearchError("هیچ درخواست تایید شده‌ای برای این پلاک یافت نشد.");
      } else {
        setSearchError(null);
      }
    },
    onError: () => {
      setSearchError("خطا در جستجو");
      toast.error("خطا در جستجو");
    },
  });

  const entryMutation = useMutation({
    mutationFn: guardApi.recordEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      setSearchResult(null);
      setSearchPlate("");
      toast.success("ورود با موفقیت ثبت شد");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail ||
          "خطا در ثبت ورود (احتمالا زمان درخواست نرسیده یا خودرو قبلا وارد شده است)"
      );
    },
  });

  const exitMutation = useMutation({
    mutationFn: guardApi.recordExit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      toast.success("خروج با موفقیت ثبت شد");
      setConfirmExit(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا در ثبت خروج");
      setConfirmExit(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;
    setSearchError(null);
    setSearchResult(null);
    searchMutation.mutate(searchPlate.trim());
  };

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-sky-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/20">
              <ScanLine size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ثبت ورود و خروج</h1>
              <p className="mt-1 text-sm text-white/70">
                مدیریت تردد خودروهای پارکینگ
              </p>
            </div>
          </div>

          <div className="hidden rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/20 sm:block">
            <p className="text-xs text-white/70">خودروهای داخل</p>
            <p className="text-xl font-bold">{activeLogs.length}</p>
          </div>
        </div>
      </div>

      {/* 👇 Search Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
            <Search size={18} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="font-bold text-secondary-900">جستجوی خودرو</h2>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="پلاک خودرو"
              placeholder="پلاک دقیق مثل: 1234ب123"
              dir="ltr"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={searchMutation.isPending}
            className="gap-2 bg-gradient-to-l from-primary-600 to-primary-500 shadow-md shadow-primary-600/20"
          >
            <Search size={18} />
            {searchMutation.isPending ? "در حال جستجو..." : "جستجو"}
          </Button>
        </form>

        {searchError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            {searchError}
          </div>
        )}

        {/* نتایج جستجو */}
        {searchResult && searchResult.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-secondary-900">
              درخواست‌های یافت شده ({searchResult.length}):
            </h3>
            {searchResult.map((req: any) => (
              <div
                key={req.id}
                className="group relative overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-l from-emerald-50/50 to-surface p-4 transition-all hover:shadow-md dark:border-emerald-800/50 dark:from-emerald-900/10 dark:to-surface"
              >
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-emerald-500 to-green-600" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        درخواست #{req.id}
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {req.status === "APPROVED" ? "تایید شده" : "در حال استفاده"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Car size={14} className="text-blue-600" />
                        <span className="font-mono font-bold text-secondary-900" dir="ltr">
                          {req.vehicle_detail?.plate_number || "---"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-emerald-600" />
                        <span className="text-secondary-900">
                          <span className="text-text-secondary">جایگاه:</span>{" "}
                          <span className="font-bold">{req.parking_space_detail?.code || "---"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Calendar size={12} />
                      <span dir="ltr">
                        {new Date(req.start_time).toLocaleString("fa-IR")} -{" "}
                        {new Date(req.end_time).toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!req.vehicle_detail?.id) {
                        toast.error("اطلاعات خودرو ناقص است");
                        return;
                      }
                      entryMutation.mutate({
                        vehicle: req.vehicle_detail.id,
                        parking_request: req.id,
                      });
                    }}
                    disabled={entryMutation.isPending}
                    className="gap-2 bg-gradient-to-l from-emerald-600 to-green-600 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
                  >
                    <LogIn size={16} /> ثبت ورود
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 👇 Active Vehicles Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Car size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-secondary-900">خودروهای داخل پارکینگ</h2>
              <p className="text-xs text-text-secondary">
                {activeLogs.length} خودرو در حال حاضر داخل است
              </p>
            </div>
          </div>
        </div>

        {isLoadingLogs ? (
          <div className="p-4">
            <TableSkeleton rows={3} cols={5} />
          </div>
        ) : activeLogs.length === 0 ? (
          <EmptyState
            icon={<Car size={48} />}
            title="هیچ خودرویی داخل پارکینگ نیست"
            description="هنگامی که خودرویی وارد شود، در این جدول نمایش داده می‌شود."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">پلاک</th>
                  <th className="px-4 py-3 font-medium">درخواست</th>
                  <th className="px-4 py-3 font-medium">زمان ورود</th>
                  <th className="px-4 py-3 font-medium">نگهبان</th>
                  <th className="px-4 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <Car size={14} />
                        </div>
                        <span className="font-mono font-bold text-secondary-900" dir="ltr">
                          {log.vehicle_detail?.plate_number || "---"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.parking_request ? (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          #{log.parking_request}
                        </span>
                      ) : (
                        <span className="text-xs text-text-secondary">بدون درخواست</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary" dir="ltr">
                      {new Date(log.entry_time).toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-secondary-900">
                        <User size={14} className="text-text-secondary" />
                        {log.guard_detail?.full_name || "---"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        className="gap-1 py-1.5 text-xs"
                        onClick={() => setConfirmExit(log.id)}
                        disabled={exitMutation.isPending}
                      >
                        <LogOut size={14} /> ثبت خروج
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmExit}
        onClose={() => setConfirmExit(null)}
        onConfirm={() => confirmExit && exitMutation.mutate(confirmExit)}
        title="ثبت خروج خودرو"
        description="آیا خروج این خودرو از پارکینگ را تایید می‌کنید؟"
        confirmText="بله، ثبت خروج"
        isLoading={exitMutation.isPending}
      />
    </div>
  );
}

export default EntryExitPage;