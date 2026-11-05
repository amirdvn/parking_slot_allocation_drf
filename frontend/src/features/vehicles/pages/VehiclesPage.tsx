// src/features/vehicles/pages/VehiclesPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { toast } from "sonner";
import { vehicleApi } from "../api";
import type { Vehicle } from "../../../types/vehicle";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import TableToolbar from "../../../components/ui/TableToolbar";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

const vehicleSchema = z.object({
  plate_number: z.string().min(1, "پلاک الزامی است").max(10, "حداکثر ۱۰ کاراکتر"),
  vehicle_type: z.enum(["CAR", "MOTORCYCLE", "BICYCLE"], { message: "نوع خودرو الزامی است" }),
  sub_type: z.enum(["PASSENGER", "CARGO", "ELECTRIC", "DISABLED"], { message: "نوع سوخت الزامی است" }),
  color: z.enum(
    ["RED", "BLUE", "GREEN", "BLACK", "WHITE", "YELLOW", "ORANGE", "PURPLE", "BROWN", "GRAY"],
    { message: "رنگ الزامی است" }
  ),
});
type VehicleFormValues = z.infer<typeof vehicleSchema>;

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
const colorOptions = [
  { value: "BLACK", label: "مشکی" },
  { value: "WHITE", label: "سفید" },
  { value: "RED", label: "قرمز" },
  { value: "BLUE", label: "آبی" },
  { value: "GREEN", label: "سبز" },
  { value: "YELLOW", label: "زرد" },
  { value: "ORANGE", label: "نارنجی" },
  { value: "PURPLE", label: "بنفش" },
  { value: "BROWN", label: "قهوه‌ای" },
  { value: "GRAY", label: "خاکستری" },
];

const typeFilterOptions = [
  { value: "", label: "همه انواع" },
  { value: "CAR", label: "ماشین" },
  { value: "MOTORCYCLE", label: "موتورسیکلت" },
  { value: "BICYCLE", label: "دوچرخه" },
];

function VehiclesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.getVehicles,
  });

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((v) => {
      const matchesSearch =
        !searchQuery || v.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !typeFilter || v.vehicle_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vehicles, searchQuery, typeFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  const createMutation = useMutation({
    mutationFn: vehicleApi.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("خودرو با موفقیت ثبت شد");
      closeModal();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.plate_number?.[0] || "خطا در ثبت خودرو";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: VehicleFormValues) => vehicleApi.updateVehicle(editingVehicle!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("خودرو با موفقیت ویرایش شد");
      closeModal();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.plate_number?.[0] || "خطا در ویرایش";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleApi.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("خودرو با موفقیت حذف شد");
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error("خطا در حذف خودرو");
      setConfirmDelete(null);
    },
  });

  const openCreateModal = () => {
    setEditingVehicle(null);
    reset({ plate_number: "", vehicle_type: "CAR", sub_type: "PASSENGER", color: "BLACK" });
    setIsModalOpen(true);
    setServerError(null);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    reset({
      plate_number: vehicle.plate_number,
      vehicle_type: vehicle.vehicle_type,
      sub_type: vehicle.sub_type,
      color: vehicle.color,
    });
    setIsModalOpen(true);
    setServerError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setServerError(null);
  };

  const onSubmit = (data: VehicleFormValues) => {
    setServerError(null);
    if (editingVehicle) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">خودروهای من</h1>
        <Button onClick={openCreateModal}>
          <Plus size={18} /> افزودن خودرو
        </Button>
      </div>

      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو بر اساس پلاک..."
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        filterOptions={typeFilterOptions}
        filterLabel="فیلتر نوع"
        resultCount={filteredVehicles.length}
        totalCount={vehicles?.length}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="mb-4 h-20 w-full rounded-xl" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            icon={<Car size={48} />}
            title={searchQuery || typeFilter ? "خودرویی یافت نشد" : "هنوز خودرویی ثبت نکرده‌اید"}
            description={
              searchQuery || typeFilter
                ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد."
                : "برای ثبت درخواست پارکینگ، ابتدا باید خودروی خود را ثبت کنید."
            }
            action={
              searchQuery || typeFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              ) : (
                <Button onClick={openCreateModal}>
                  <Plus size={18} /> افزودن اولین خودرو
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const vehicleTypeColor =
              vehicle.vehicle_type === "CAR"
                ? "from-blue-500 to-blue-600"
                : vehicle.vehicle_type === "MOTORCYCLE"
                  ? "from-orange-500 to-red-600"
                  : "from-emerald-500 to-green-600";

            const vehicleTypeLabel =
              vehicleTypeOptions.find((o) => o.value === vehicle.vehicle_type)?.label;

            return (
              <div
                key={vehicle.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${vehicleTypeColor}`} />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-xl bg-gradient-to-br ${vehicleTypeColor} p-2 text-white shadow-md`}>
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">{vehicleTypeLabel}</p>
                      <p className="font-mono text-lg font-bold text-secondary-900" dir="ltr">
                        {vehicle.plate_number}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      vehicle.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {vehicle.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </div>

                <div className="space-y-2 rounded-xl bg-background/50 p-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">وضعیت</span>
                    <span className="font-medium text-secondary-900">
                      {subTypeOptions.find((o) => o.value === vehicle.sub_type)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">رنگ</span>
                    <span className="font-medium text-secondary-900">
                      {colorOptions.find((o) => o.value === vehicle.color)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                  >
                    <Edit size={14} /> ویرایش
                  </button>
                  <button
                    onClick={() => setConfirmDelete(vehicle)}
                    disabled={deleteMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingVehicle ? "ویرایش خودرو" : "افزودن خودرو جدید"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="شماره پلاک"
            placeholder="مثلا 1234ب123"
            dir="ltr"
            error={errors.plate_number?.message}
            {...register("plate_number")}
          />
          <Select
            label="نوع وسیله نقلیه"
            options={vehicleTypeOptions}
            error={errors.vehicle_type?.message}
            {...register("vehicle_type")}
          />
          <Select
            label="نوع سوخت / حالت"
            options={subTypeOptions}
            error={errors.sub_type?.message}
            {...register("sub_type")}
          />
          <Select
            label="رنگ"
            options={colorOptions}
            error={errors.color?.message}
            {...register("color")}
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingVehicle ? "ذخیره تغییرات" : "ثبت خودرو"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="حذف خودرو"
        description={`آیا از حذف خودرو با پلاک «${confirmDelete?.plate_number}» مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default VehiclesPage;