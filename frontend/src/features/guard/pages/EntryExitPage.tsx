// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Car, Clock, CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { guardApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";

function EntryExitPage() {
  const queryClient = useQueryClient();
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState<number | null>(null);

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  const { data: approvedRequests, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["guard-approved-requests"],
    queryFn: guardApi.getApprovedRequests,
    refetchInterval: 30000,
  });

  const activeLogs = logs?.filter((l) => !l.exit_time) || [];

  // 👇 دسته‌بندی درخواست‌ها بر اساس زمان
  const now = new Date();
  const readyNow = approvedRequests?.filter((req: any) => {
    const start = new Date(req.start_time);
    const end = new Date(req.end_time);
    return now >= start && now <= end;
  }) || [];

  const upcoming = approvedRequests?.filter((req: any) => {
    const start = new Date(req.start_time);
    return now < start;
  }) || [];

  const searchMutation = useMutation({
    mutationFn: guardApi.searchVehicle,
    onSuccess: (data) => {
      setResult(data);
      if (!data || data.length === 0) setError("درخواستی یافت نشد");
      else setError(null);
    },
  });

  const entryMutation = useMutation({
    mutationFn: guardApi.recordEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["guard-approved-requests"] });
      setResult(null);
      setPlate("");
      toast.success("ورود ثبت شد");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || e.response?.data?.parking_space?.[0] || "خطا در ثبت ورود");
    },
  });

  const exitMutation = useMutation({
    mutationFn: guardApi.recordExit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      toast.success("خروج ثبت شد");
      setConfirmExit(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || "خطا");
      setConfirmExit(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="ثبت ورود و خروج"
        subtitle={`${activeLogs.length} داخل پارکینگ · ${readyNow.length} آماده ورود · ${upcoming.length} در آینده`}
        toolbar={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (plate.trim()) searchMutation.mutate(plate.trim());
            }}
            className="flex h-full gap-2"
          >
            <div className="flex-1">
              <Input
                placeholder="جستجوی پلاک..."
                dir="ltr"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={searchMutation.isPending}>
              <Search size={16} />
            </Button>
          </form>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-[13px] text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
          {error}
        </div>
      )}

      {/* نتایج جستجو */}
      {result && result.length > 0 && (
        <div className="mb-4 space-y-2">
          {result.map((req) => {
            const start = new Date(req.start_time);
            const end = new Date(req.end_time);
            const isReady = now >= start && now <= end;

            return (
              <div
                key={req.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  isReady
                    ? "border-[#007aff]/20 bg-[#007aff]/5"
                    : "border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10"
                }`}
              >
                <div>
                  <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                    {req.vehicle_detail?.plate_number}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    جایگاه {req.parking_space_detail?.code} · {new Date(req.start_time).toLocaleString("fa-IR")}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    entryMutation.mutate({
                      vehicle: req.vehicle_detail.id,
                      parking_request: req.id,
                    })
                  }
                  disabled={entryMutation.isPending || !isReady}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <LogIn size={14} /> ثبت ورود
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 👇 بخش آماده ورود (زمانش رسیده) */}
      <div className="mb-4 rounded-2xl bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-[#38383a]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                آماده ورود
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                درخواست‌های تایید شده در بازه زمانی فعال
              </p>
            </div>
          </div>
          {readyNow.length > 0 && (
            <span className="rounded-full bg-[#34c759]/10 px-2.5 py-1 text-[11px] font-bold text-[#34c759] dark:bg-[#30d158]/15 dark:text-[#30d158]">
              {readyNow.length}
            </span>
          )}
        </div>

        {isLoadingApproved ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
            ))}
          </div>
        ) : readyNow.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
            درخواست آماده ورودی وجود ندارد
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#38383a]">
            {readyNow.map((req: any) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                      {req.vehicle_detail?.plate_number}
                    </p>
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                      آماده ورود
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <p>کاربر: {req.user_detail?.full_name} · {req.user_detail?.phone_number}</p>
                    <p>جایگاه: {req.parking_space_detail?.code}</p>
                    <p dir="ltr">
                      {new Date(req.start_time).toLocaleString("fa-IR")} → {new Date(req.end_time).toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    entryMutation.mutate({
                      vehicle: req.vehicle_detail.id,
                      parking_request: req.id,
                    })
                  }
                  disabled={entryMutation.isPending}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <LogIn size={14} /> ثبت ورود
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 👇 بخش در آینده (زمانش نرسیده) */}
      {upcoming.length > 0 && (
        <div className="mb-4 rounded-2xl bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-[#38383a]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500">
                <CalendarClock size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  در آینده
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  درخواست‌های تایید شده با زمان شروع در آینده
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
              {upcoming.length}
            </span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-[#38383a]">
            {upcoming.map((req: any) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 p-4 opacity-75 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                      {req.vehicle_detail?.plate_number}
                    </p>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-500">
                      در آینده
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <p>کاربر: {req.user_detail?.full_name}</p>
                    <p>جایگاه: {req.parking_space_detail?.code}</p>
                    <p dir="ltr">
                      شروع: {new Date(req.start_time).toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>
                <Button
                  disabled
                  className="gap-1.5 whitespace-nowrap opacity-50"
                  title="زمان شروع این درخواست هنوز نرسیده است"
                >
                  <LogIn size={14} /> ثبت ورود
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول خودروهای داخل پارکینگ */}
      <div className="rounded-2xl bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 p-5 dark:border-[#38383a]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
            <Car size={18} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            خودروهای داخل پارکینگ
          </h3>
        </div>

        {isLoadingLogs ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
            ))}
          </div>
        ) : activeLogs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
            خودرویی داخل پارکینگ نیست
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#38383a]">
            {activeLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50"
              >
                <div>
                  <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                    {log.vehicle_detail?.plate_number}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500" dir="ltr">
                    ورود: {new Date(log.entry_time).toLocaleString("fa-IR")}
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setConfirmExit(log.id)}
                  disabled={exitMutation.isPending}
                  className="text-[12px]"
                >
                  <LogOut size={14} /> خروج
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmExit}
        onClose={() => setConfirmExit(null)}
        onConfirm={() => confirmExit && exitMutation.mutate(confirmExit)}
        title="ثبت خروج"
        description="آیا خروج این خودرو را تایید می‌کنید؟"
        confirmText="تایید"
        isLoading={exitMutation.isPending}
      />
    </div>
  );
}

export default EntryExitPage;