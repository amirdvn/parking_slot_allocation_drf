// src/features/guard/pages/EntryExitPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Car } from "lucide-react";
import { guardApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

function EntryExitPage() {
  const queryClient = useQueryClient();
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // گرفتن لاگ‌ها (ماشین‌های داخل پارکینگ)
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["entry-exit-logs"],
    queryFn: guardApi.getLogs,
  });

  // ماشین‌هایی که هنوز خارج نشدن
  const activeLogs = logs?.filter((log) => !log.exit_time) || [];

  // Mutation جستجو
  const searchMutation = useMutation({
    mutationFn: guardApi.searchVehicle,
    onSuccess: (data) => {
      setSearchResult(data);
      if (data.length === 0) setSearchError("هیچ درخواست تایید شده‌ای برای این پلاک یافت نشد.");
      else setSearchError(null);
    },
    onError: () => setSearchError("خطا در جستجو"),
  });

  // Mutation ثبت ورود
  const entryMutation = useMutation({
    mutationFn: guardApi.recordEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      setSearchResult(null);
      setSearchPlate("");
      alert("ورود با موفقیت ثبت شد.");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "خطا در ثبت ورود (احتمالا زمان درخواست نرسیده یا خودرو قبلا وارد شده است)");
    },
  });

  // Mutation ثبت خروج
  const exitMutation = useMutation({
    mutationFn: guardApi.recordExit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-exit-logs"] });
      alert("خروج با موفقیت ثبت شد.");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "خطا در ثبت خروج");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;
    setSearchError(null);
    searchMutation.mutate(searchPlate);
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
              placeholder="مثلا 1234ب123"
              dir="ltr"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={searchMutation.isPending} className="gap-2 mb-0.5">
            <Search size={18} /> جستجو
          </Button>
        </form>

        {searchError && <p className="mt-4 text-sm text-danger">{searchError}</p>}

        {/* نتایج جستجو */}
        {searchResult && searchResult.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-secondary-900">درخواست‌های یافت شده:</h3>
            {searchResult.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="text-sm">
                  <p className="font-bold">درخواست #{req.id}</p>
                  <p className="text-text-secondary text-xs mt-1">
                    وضعیت: {req.status === "APPROVED" ? "تایید شده" : "در حال استفاده"} | جایگاه: {req.parking_space}
                  </p>
                </div>
                <Button
                  onClick={() => entryMutation.mutate({ vehicle: req.vehicle, parking_request: req.id })}
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
          <div className="p-8 text-center text-text-secondary">در حال بارگذاری...</div>
        ) : activeLogs.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">هیچ خودرویی در حال حاضر داخل پارکینگ نیست.</div>
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
                        onClick={() => {
                          if (window.confirm("آیا خروج این خودرو را تایید می‌کنید؟")) {
                            exitMutation.mutate(log.id);
                          }
                        }}
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
    </div>
  );
}

export default EntryExitPage;