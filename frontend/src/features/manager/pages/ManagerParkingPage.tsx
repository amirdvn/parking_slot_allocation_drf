// src/features/manager/pages/ManagerParkingPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { parkingApi } from "../../parking/api";
import type { ParkingSpace } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";

const spaceSchema = z.object({
  zone: z.enum(["NORTH", "SOUTH", "WEST", "EAST"]),
  floor: z.enum(["GROUND", "FLOOR_1", "FLOOR_2", "BASEMENT_1", "BASEMENT_2"]),
  space_type: z.enum(["NORMAL", "GUEST", "MANAGERS", "DISABLED", "MOTORCYCLE", "ELECTRIC", "LOADING", "EMERGENCY"]),
  description: z.string().optional(),
});
type SpaceFormValues = z.infer<typeof spaceSchema>;

const zoneOptions = [
  { value: "NORTH", label: "بخش شمالی" }, { value: "SOUTH", label: "بخش جنوبی" },
  { value: "WEST", label: "بخش غربی" }, { value: "EAST", label: "بخش شرقی" },
];
const floorOptions = [
  { value: "GROUND", label: "همکف" }, { value: "FLOOR_1", label: "طبقه ۱" },
  { value: "FLOOR_2", label: "طبقه ۲" }, { value: "BASEMENT_1", label: "منفی ۱" },
  { value: "BASEMENT_2", label: "منفی ۲" },
];
const typeOptions = [
  { value: "NORMAL", label: "عادی" }, { value: "GUEST", label: "مهمان" },
  { value: "MANAGERS", label: "مدیران" }, { value: "DISABLED", label: "معلولین" },
  { value: "MOTORCYCLE", label: "موتور" }, { value: "ELECTRIC", label: "برقی" },
  { value: "LOADING", label: "بارگیری" }, { value: "EMERGENCY", label: "اضطراری" },
];

function ManagerParkingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: parkingApi.getSpaces,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
  });

  const createMutation = useMutation({
    mutationFn: parkingApi.createSpace,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parking-spaces"] }); closeModal(); },
    onError: (err: any) => setServerError(err.response?.data?.detail || "خطا در ثبت جایگاه"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SpaceFormValues) => parkingApi.updateSpace(editingSpace!.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parking-spaces"] }); closeModal(); },
    onError: (err: any) => setServerError(err.response?.data?.detail || "خطا در ویرایش جایگاه"),
  });

  const deleteMutation = useMutation({
    mutationFn: parkingApi.deleteSpace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parking-spaces"] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (space: ParkingSpace) => parkingApi.updateSpace(space.id, { is_active: !space.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parking-spaces"] }),
  });

  const openCreateModal = () => {
    setEditingSpace(null);
    reset({ zone: "NORTH", floor: "GROUND", space_type: "NORMAL", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (space: ParkingSpace) => {
    setEditingSpace(space);
    reset({ zone: space.zone, floor: space.floor, space_type: space.space_type, description: space.description || "" });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingSpace(null); setServerError(null); };

  const onSubmit = (data: SpaceFormValues) => {
    setServerError(null);
    if (editingSpace) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  if (isLoading) return <div className="p-4">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">مدیریت فضاهای پارکینگ</h1>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus size={18} /> جایگاه جدید
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-background text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">کد جایگاه</th>
              <th className="px-4 py-3 font-medium">بخش / طبقه</th>
              <th className="px-4 py-3 font-medium">نوع</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {spaces?.map((space) => (
              <tr key={space.id} className="hover:bg-background/50">
                <td className="px-4 py-3 font-mono font-bold text-primary-700">{space.code}</td>
                <td className="px-4 py-3">
                  {zoneOptions.find(o => o.value === space.zone)?.label} / {floorOptions.find(o => o.value === space.floor)?.label}
                </td>
                <td className="px-4 py-3">
                  {typeOptions.find(o => o.value === space.space_type)?.label}
                  {space.requires_permission && <span className="ml-2 text-xs text-orange-500">(نیاز به مجوز)</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${space.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {space.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatusMutation.mutate(space)} className="text-text-secondary hover:text-primary-600" title="تغییر وضعیت">
                      <Power size={18} />
                    </button>
                    <button onClick={() => openEditModal(space)} className="text-text-secondary hover:text-blue-600" title="ویرایش">
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm("آیا از حذف این جایگاه مطمئن هستید؟")) deleteMutation.mutate(space.id); }}
                      className="text-text-secondary hover:text-danger" title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSpace ? "ویرایش جایگاه" : "افزودن جایگاه جدید"}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select label="بخش" options={zoneOptions} error={errors.zone?.message} {...register("zone")} />
          <Select label="طبقه" options={floorOptions} error={errors.floor?.message} {...register("floor")} />
          <Select label="نوع جایگاه" options={typeOptions} error={errors.space_type?.message} {...register("space_type")} />
          <Input label="توضیحات (اختیاری)" {...register("description")} />

          {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{serverError}</div>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingSpace ? "ذخیره تغییرات" : "ثبت جایگاه"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} className="flex-1">انصراف</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ManagerParkingPage;