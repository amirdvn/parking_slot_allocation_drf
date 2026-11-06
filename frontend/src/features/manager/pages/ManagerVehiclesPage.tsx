// src/features/manager/pages/ManagerVehiclesPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerVehicle } from "../../../types/manager";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Pagination from "../../../components/ui/Pagination";
import PageHeader from "../../../components/shared/PageHeader";
import { formatPlate } from "../../../lib/parking-format";

const typeLabels: Record<string, string> = {
  CAR: "ماشین",
  MOTORCYCLE: "موتور",
  BICYCLE: "دوچرخه",
};

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

  const usersMap = useMemo(() => {
    const map: Record<number, any> = {};
    usersData?.results?.forEach((u) => {
      map[u.id] = u;
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
              {filtered.map((vehicle) => {
                const owner = usersMap[vehicle.user];
                return (
                  <tr key={vehicle.id} className="hover:bg-background/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-[12px] font-semibold text-white dark:bg-[#0a84ff]">
                          {owner?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {owner?.full_name || `کاربر #${vehicle.user}`}
                          </p>
                          {owner?.phone_number && (
                            <p className="truncate text-[11px] text-gray-500" dir="ltr">
                              {owner.phone_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {formatPlate(vehicle.plate_number)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {typeLabels[vehicle.vehicle_type]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          vehicle.is_active
                            ? "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]"
                            : "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500"
                        }`}
                      >
                        {vehicle.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => setConfirmToggle(vehicle)}
                        className="text-[12px] font-medium text-[#007aff] hover:underline dark:text-[#0a84ff]"
                      >
                        {vehicle.is_active ? "غیرفعال" : "فعال"}
                      </button>
                    </td>
                  </tr>
                );
              })}
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