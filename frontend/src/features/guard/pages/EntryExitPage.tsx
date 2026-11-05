// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Car } from "lucide-react";
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
      <h1 className="text-xl font-bold text-secondary-900">ثبت ورود و خروج</h1>

      {/* بخش جستجو */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="جستجوی پلاک خودرو"
              placeholder="پلاک دقیق مثل: 1234ب123"
              dir="ltr"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={searchMutation.isPending}
            className="gap-2 mb-0.5"
          >
            <Search size={18} />
            {searchMutation.isPending ? "در حال جستجو..." : "جستجو"}
          </Button>
        </form>

        {searchError && <p className="mt-4 text-sm text-danger">{searchError}</p>}

        {/* نتایج جستجو */}
        {searchResult && searchResult.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-secondary-900">
              درخواست‌های یافت شده ({searchResult.length}):
            </h3>
            {searchResult.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div className="text-sm">
                  <p className="font-bold">درخواست #{req.id}</p>
                  <p className="text-text-secondary text-xs mt-1">
                    پلاک:{" "}
                    <span className="font-mono font-bold" dir="ltr">
                      {req.vehicle_detail?.plate_number || "---"}
                    </span>{" "}
                    | جایگاه:{" "}
                    <span className="font-bold">
                      {req.parking_space_detail?.code || "---"}
                    </span>{" "}
                    | وضعیت:{" "}
                    {req.status === "APPROVED" ? "تایید شده" : "در حال استفاده"}
                  </p>
                  <p className="text-text-secondary text-xs mt-1" dir="ltr">
                    {new Date(req.start_time).toLocaleString("fa-IR")} -{" "}
                    {new Date(req.end_time).toLocaleString("fa-IR")}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // 👇 اصلاح شد: از vehicle_detail.id استفاده می‌کنیم
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
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <LogIn size={16} /> ثبت ورود
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* جدول ماشین‌های داخل پارکینگ */}
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4">
          <h2 className="flex items-center gap-2 font-bold text-secondary-900">
            <Car size={20} className="text-primary-600" />
            خودروهای داخل پارکینگ
          </h2>
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
                  <tr key={log.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-mono font-bold" dir="ltr">
                      {log.vehicle_detail?.plate_number || "---"}
                    </td>
                    <td className="px-4 py-3">
                      {log.parking_request ? `#${log.parking_request}` : "بدون درخواست"}
                    </td>
                    <td className="px-4 py-3 text-xs" dir="ltr">
                      {new Date(log.entry_time).toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">{log.guard_detail?.full_name || "---"}</td>
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