// src/features/vehicles/pages/VehiclesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { toast } from "sonner";
import { vehicleApi } from "../api";
import type { Vehicle } from "../../../types/vehicle";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";
import LicensePlateInput from "../../../components/ui/LicensePlateInput";
import { formatPlate } from "../../../lib/parking-format";

const schema = z.object({
  plate_number: z.string().refine(
    (v) => v.replace(/[^0-9۰-۹آ-ی]/g, "").length === 8,
    "پلاک باید به فرمت کامل وارد شود (۱۲ ب ۳۴۵ ۶۷)"
  ),
  vehicle_type: z.enum(["CAR", "MOTORCYCLE", "BICYCLE"]),
  sub_type: z.enum(["PASSENGER", "CARGO", "ELECTRIC", "DISABLED"]),
  color: z.enum(["RED", "BLUE", "GREEN", "BLACK", "WHITE", "YELLOW", "ORANGE", "PURPLE", "BROWN", "GRAY"]),
});
type FormValues = z.infer<typeof schema>;

const typeOpts = [
  { value: "CAR", label: "ماشین" },
  { value: "MOTORCYCLE", label: "موتور" },
  { value: "BICYCLE", label: "دوچرخه" },
];
const subOpts = [
  { value: "PASSENGER", label: "سواری" },
  { value: "CARGO", label: "باری" },
  { value: "ELECTRIC", label: "برقی" },
  { value: "DISABLED", label: "معلولین" },
];
const colorOpts = [
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

function VehiclesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.getVehicles,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: vehicleApi.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("ثبت شد");
      closeModal();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.plate_number?.[0] || "خطا"),
  });

  const updateMutation = useMutation({
    mutationFn: (d: FormValues) => vehicleApi.updateVehicle(editing!.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("ذخیره شد");
      closeModal();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.plate_number?.[0] || "خطا"),
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleApi.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("حذف شد");
      setConfirmDelete(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      plate_number: "",
      vehicle_type: "CAR",
      sub_type: "PASSENGER",
      color: "BLACK",
    });
    setIsModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    reset({
      plate_number: v.plate_number,
      vehicle_type: v.vehicle_type,
      sub_type: v.sub_type,
      color: v.color,
    });
    setIsModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="خودروهای من"
        subtitle={`${vehicles?.length || 0} خودرو`}
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> خودرو جدید
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : !vehicles?.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <Car size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            هنوز خودرویی ثبت نکرده‌اید
          </h3>
          <Button onClick={openCreate} className="mt-4">
            <Plus size={16} /> افزودن خودرو
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[15px] font-bold text-gray-900 dark:text-white">
                    {formatPlate(v.plate_number)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {typeOpts.find((o) => o.value === v.vehicle_type)?.label}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    v.is_active
                      ? "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]"
                      : "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500"
                  }`}
                >
                  {v.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                <button
                  onClick={() => openEdit(v)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[12px] text-gray-700 transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:text-gray-300 dark:hover:bg-[#3a3a3c]"
                >
                  <Edit size={14} /> ویرایش
                </button>
                <button
                  onClick={() => setConfirmDelete(v)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-[12px] text-[#ff3b30] transition-colors hover:bg-red-50 dark:bg-[#2c2c2e] dark:hover:bg-[#ff453a]/10"
                >
                  <Trash2 size={14} /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? "ویرایش خودرو" : "خودرو جدید"}
      >
        <form
          onSubmit={handleSubmit((d) =>
            editing ? updateMutation.mutate(d) : createMutation.mutate(d)
          )}
          className="space-y-3"
        >
          <Controller
            name="plate_number"
            control={control}
            render={({ field, fieldState }) => (
              <LicensePlateInput
                label="پلاک خودرو"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Select
            label="نوع"
            options={typeOpts}
            error={errors.vehicle_type?.message}
            {...register("vehicle_type")}
          />
          <Select
            label="حالت"
            options={subOpts}
            error={errors.sub_type?.message}
            {...register("sub_type")}
          />
          <Select
            label="رنگ"
            options={colorOpts}
            error={errors.color?.message}
            {...register("color")}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "ذخیره" : "ثبت"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
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
        description={`آیا خودرو با پلاک «${formatPlate(confirmDelete?.plate_number)}» حذف شود؟`}
        confirmText="حذف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default VehiclesPage;