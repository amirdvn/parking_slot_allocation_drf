// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Car } from "lucide-react";
import { toast } from "sonner";
import { guardApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

function EntryExitPage() {
  const queryClient = useQueryClient();
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState<number | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
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
    onError: (e: any) => { toast.error(e.response?.data?.detail || "خطا"); setConfirmExit(null); },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">ثبت ورود و خروج</h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          {activeLogs.length} خودرو داخل پارکینگ
        </p>
      </div>

      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); if (plate.trim()) searchMutation.mutate(plate.trim()); }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <Input
              placeholder="پلاک خودرو..."
              dir="ltr"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={searchMutation.isPending}>
            <Search size={16} /> جستجو
          </Button>
        </form>

        {error && <p className="mt-3 text-[13px] text-[#ff3b30] dark:text-[#ff453a]">{error}</p>}

        {result && result.length > 0 && (
          <div className="mt-4 space-y-2">
            {result.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-[#2c2c2e]">
                <div>
                  <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white" dir="ltr">
                    {req.vehicle_detail?.plate_number}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    جایگاه {req.parking_space_detail?.code}
                  </p>
                </div>
                <Button
                  onClick={() => entryMutation.mutate({ vehicle: req.vehicle_detail.id, parking_request: req.id })}
                  disabled={entryMutation.isPending}
                  className="gap-1.5"
                >
                  <LogIn size={14} /> ورود
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-surface shadow-sm">
        <div className="border-b border-gray-200 p-5 dark:border-[#38383a]">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">داخل پارکینگ</h3>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-[#2c2c2e]" />
            ))}
          </div>
        ) : activeLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
              <Car size={28} />
            </div>
            <p className="text-[13px] text-gray-500">خودرویی داخل نیست</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#38383a]">
            {activeLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50">
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