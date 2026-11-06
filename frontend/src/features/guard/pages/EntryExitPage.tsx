// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Car, Clock } from "lucide-react";
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

  // دریافت لاگ‌های داخل پارکینگ
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  // 👇 دریافت درخواست‌های تایید شده
  const { data: approvedRequests, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["guard-approved-requests"],
    queryFn: guardApi.getApprovedRequests,
    refetchInterval: 30000, // هر ۳۰ ثانیه رفرش کن
  });

  const activeLogs = logs?.filter((l) => !l.exit_time) || [];

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
    onError: (e: any) => toast.error(e.response?.data?.detail || "خطا"),
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
        subtitle={`${activeLogs.length} خودرو داخل پارکینگ · ${approvedRequests?.length || 0} در انتظار ورود`}
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
          {result.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-2xl border border-[#007aff]/20 bg-[#007aff]/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                  {req.vehicle_detail?.plate_number}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  جایگاه {req.parking_space_detail?.code}
                </p>
              </div>
              <Button
                onClick={() =>
                  entryMutation.mutate({
                    vehicle: req.vehicle_detail.id,
                    parking_request: req.id,
                  })
                }
                disabled={entryMutation.isPending}
              >
                <LogIn size={14} /> ثبت ورود
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 👇 بخش جدید: درخواست‌های آماده ورود */}
      <div className="mb-4 rounded-2xl bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-[#38383a]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                در انتظار ورود
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                درخواست‌های تایید شده آماده ثبت ورود
              </p>
            </div>
          </div>
          {approvedRequests && approvedRequests.length > 0 && (
            <span className="rounded-full bg-[#007aff]/10 px-2.5 py-1 text-[11px] font-bold text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]">
              {approvedRequests.length}
            </span>
          )}
        </div>

        {isLoadingApproved ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
            ))}
          </div>
        ) : !approvedRequests || approvedRequests.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
            درخواست تایید شده‌ای در انتظار ورود نیست
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#38383a]">
            {approvedRequests.map((req: any) => (
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
                      تایید شده
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <p>
                      کاربر: {req.user_detail?.full_name} · {req.user_detail?.phone_number}
                    </p>
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

      {/* جدول خودروهای داخل پارکینگ */}
      <div className="rounded-2xl bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 p-5 dark:border-[#38383a]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
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