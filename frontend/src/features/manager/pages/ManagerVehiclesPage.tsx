import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Power,
  User as UserIcon,
  Phone,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerVehicle } from "../../../types/manager";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import Pagination from "../../../components/ui/Pagination";
import TableToolbar from "../../../components/ui/TableToolbar";
import { TableSkeleton } from "../../../components/ui/Skeleton";

const vehicleTypeOptions = [
  { value: "CAR", label: "ماشین" },
  { value: "MOTORCYCLE", label: "موتورسیکلت" },
  { value: "BICYCLE", label: "دوچرخه" },
];

const subTypeOptions = [
  { value: "PASSENGER", label: "عادی / سواری" },
  { value: "CARGO", label: "باری" },
  { value: "ELECTRIC", label: "برقی" },
  { value: "DISABLED", label: "معلولین" },
];

const vehicleTypeColors: Record<string, string> = {
  CAR: "from-blue-500 to-blue-600",
  MOTORCYCLE: "from-orange-500 to-red-600",
  BICYCLE: "from-emerald-500 to-green-600",
};

function ManagerVehiclesPage() {
  const queryClient = useQueryClient();
  const [confirmToggle, setConfirmToggle] = useState<ManagerVehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["manager-vehicles", currentPage],
    queryFn: () => managerApi.getAllVehicles(currentPage),
  });

  // گرفتن لیست کاربران برای نمایش اسم مالک
  const { data: usersData } = useQuery({
    queryKey: ["manager-users-all"],
    queryFn: () => managerApi.getUsers(1),
  });

  const vehicles = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // مپ کردن user id به اطلاعات کاربر
  const usersMap = useMemo(() => {
    const map: Record<number, any> = {};
    usersData?.results?.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [usersData]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        !searchQuery ||
        v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        usersMap[v.user]?.full_name?.includes(searchQuery) ||
        usersMap[v.user]?.phone_number?.includes(searchQuery);
      const matchesType = !typeFilter || v.vehicle_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vehicles, searchQuery, typeFilter, usersMap]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      managerApi.toggleVehicleStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["manager-vehicles"] });
      toast.success(
        variables.isActive ? "خودرو فعال شد" : "خودرو غیرفعال شد"
      );
      setConfirmToggle(null);
    },
    onError: () => {
      toast.error("خطا در تغییر وضعیت خودرو");
      setConfirmToggle(null);
    },
  });

  // آمار
  const stats = useMemo(() => {
    return {
      total: totalCount,
      active: vehicles.filter((v) => v.is_active).length,
      inactive: vehicles.filter((v) => !v.is_active).length,
    };
  }, [vehicles, totalCount]);

  return (
    <div className="space-y-6">
      {/* 👇 Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-700 via-slate-800 to-gray-900 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/20">
              <Car size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مدیریت خودروها</h1>
              <p className="mt-1 text-sm text-white/70">
                تمام خودروهای ثبت‌شده در سیستم
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-[10px] text-white/70">کل</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-[10px] text-white/70">فعال</p>
              <p className="text-lg font-bold text-emerald-300">
                {stats.active}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 Toolbar */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو بر اساس پلاک، نام یا شماره مالک..."
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        filterOptions={[
          { value: "", label: "همه انواع" },
          ...vehicleTypeOptions,
        ]}
        filterLabel="فیلتر نوع"
        resultCount={filteredVehicles.length}
        totalCount={vehicles.length}
      />

      {/* 👇 Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            icon={<Car size={48} />}
            title={
              searchQuery || typeFilter
                ? "خودرویی یافت نشد"
                : "هیچ خودرویی در سیستم ثبت نشده است"
            }
            description={
              searchQuery || typeFilter
                ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد."
                : "هنگامی که کاربران خودرو ثبت کنند، اینجا نمایش داده می‌شود."
            }
            action={
              (searchQuery || typeFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">مالک</th>
                  <th className="px-4 py-3 font-medium">پلاک</th>
                  <th className="px-4 py-3 font-medium">نوع</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVehicles.map((vehicle) => {
                  const owner = usersMap[vehicle.user];
                  const typeColor =
                    vehicleTypeColors[vehicle.vehicle_type] ||
                    "from-slate-500 to-slate-700";

                  return (
                    <tr
                      key={vehicle.id}
                      className="group hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-bold text-white">
                            {owner?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-secondary-900">
                              {owner?.full_name || `کاربر #${vehicle.user}`}
                            </p>
                            {owner?.phone_number && (
                              <p
                                className="text-xs text-text-secondary font-mono"
                                dir="ltr"
                              >
                                {owner.phone_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-lg bg-gradient-to-br ${typeColor} p-1.5 text-white shadow-sm`}
                          >
                            <Car size={14} />
                          </div>
                          <span
                            className="font-mono font-bold text-secondary-900"
                            dir="ltr"
                          >
                            {vehicle.plate_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium text-secondary-900">
                          {vehicleTypeOptions.find(
                            (o) => o.value === vehicle.vehicle_type
                          )?.label}
                        </p>
                        <p className="text-text-secondary">
                          {subTypeOptions.find(
                            (o) => o.value === vehicle.sub_type
                          )?.label}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            vehicle.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {vehicle.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={vehicle.is_active ? "danger" : "primary"}
                          className={`gap-2 py-1.5 px-3 text-xs ${
                            !vehicle.is_active
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }`}
                          onClick={() => setConfirmToggle(vehicle)}
                          disabled={toggleMutation.isPending}
                        >
                          <Power size={14} />
                          {vehicle.is_active ? "غیرفعال" : "فعال"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => {
          if (confirmToggle) {
            toggleMutation.mutate({
              id: confirmToggle.id,
              isActive: !confirmToggle.is_active,
            });
          }
        }}
        title="تغییر وضعیت خودرو"
        description={`آیا از ${
          confirmToggle?.is_active ? "غیرفعال" : "فعال"
        } کردن خودرو با پلاک «${confirmToggle?.plate_number}» مطمئن هستید؟`}
        confirmText="بله، تغییر بده"
        variant="primary"
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}

export default ManagerVehiclesPage;