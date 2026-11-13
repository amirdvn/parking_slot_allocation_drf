// src/features/manager/pages/ManagerVehiclesPage.tsx
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerVehicle } from "../../../types/manager";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Pagination from "../../../components/ui/Pagination";
import PageHeader from "../../../components/shared/PageHeader";
import { VehicleRow } from "../components/VehicleRow";
import { formatPlate } from "../../../lib/parking-format";

function ManagerVehiclesPage() {
  const queryClient = useQueryClient();
  const [confirmToggle, setConfirmToggle] = useState<ManagerVehicle | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-vehicles", page],
    queryFn: () => managerApi.getAllVehicles(page),
  });

  const { data: usersData } = useQuery({
    queryKey: ["manager-users-all"],
    queryFn: () => managerApi.getUsers(1),
  });

  const vehicles = data?.results || [];
  const total = data?.count || 0;
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);

  // ✅ نگاشت کاربران به id برای جستجوی سریع
  const usersMap = useMemo(() => {
    const map: Record<number, { full_name: string; phone_number: string }> = {};
    usersData?.results?.forEach((u) => {
      map[u.id] = { full_name: u.full_name, phone_number: u.phone_number };
    });
    return map;
  }, [usersData]);

  const filtered = useMemo(() => {
    if (!search) return vehicles;
    return vehicles.filter((v) => {
      const owner = usersMap[v.user];
      return (
        v.plate_number.includes(search) ||
        owner?.full_name?.includes(search) ||
        owner?.phone_number?.includes(search)
      );
    });
  }, [vehicles, search, usersMap]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      managerApi.toggleVehicleStatus(id, isActive),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["manager-vehicles"] });
      toast.success(v.isActive ? "فعال شد" : "غیرفعال شد");
      setConfirmToggle(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || "خطا در تغییر وضعیت");
      setConfirmToggle(null);
    },
  });

  // ✅ callback پایدار برای ردیف‌ها
  const handleToggleClick = useCallback((vehicle: ManagerVehicle) => {
    setConfirmToggle(vehicle);
  }, []);

  return (
    <div>
      <PageHeader
        title="مدیریت خودروها"
        subtitle={`${total} خودرو در سیستم`}
        toolbar={
          <Input
            placeholder="جستجو بر اساس پلاک یا نام..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]"
            />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <Car size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            خودرویی یافت نشد
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-right text-[13px]">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-right font-medium">مالک</th>
                <th className="px-4 py-3 text-right font-medium">پلاک</th>
                <th className="px-4 py-3 text-right font-medium">نوع</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((vehicle) => (
                <VehicleRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  owner={usersMap[vehicle.user]}
                  onToggleClick={handleToggleClick}
                />
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={pageSize}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() =>
          confirmToggle &&
          toggleMutation.mutate({
            id: confirmToggle.id,
            isActive: !confirmToggle.is_active,
          })
        }
        title="تغییر وضعیت"
        description={`آیا ${confirmToggle?.is_active ? "غیرفعال" : "فعال"} کردن خودرو «${formatPlate(confirmToggle?.plate_number)}» مطمئنید؟`}
        confirmText="تایید"
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}

export default ManagerVehiclesPage;