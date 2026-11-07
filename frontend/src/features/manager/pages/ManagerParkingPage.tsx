// src/features/manager/pages/ManagerParkingPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form"; // 👈 Controller اضافه شد
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus, Edit, Trash2, Power, ParkingSquare, Ban, Lock, Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../../parking/api";
import type { ParkingSpace, ParkingBlock } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";
import PersianDatePicker from "../../../components/ui/PersianDatePicker"; // 👈 اضافه شد
import { formatSpaceId, spaceLabel, zoneLabels, floorLabels } from "../../../lib/parking-format";

const spaceSchema = z.object({
  zone: z.enum(["NORTH", "SOUTH", "WEST", "EAST"]),
  floor: z.enum(["GROUND", "FLOOR_1", "FLOOR_2", "BASEMENT_1", "BASEMENT_2"]),
  space_type: z.enum([
    "NORMAL", "GUEST", "MANAGERS", "DISABLED",
    "MOTORCYCLE", "ELECTRIC", "LOADING", "EMERGENCY",
  ]),
  description: z.string().optional(),
});
type SpaceFormValues = z.infer<typeof spaceSchema>;

const blockSchema = z.object({
  parking_space: z.string().min(1, "جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
  reason: z.enum(["REPAIR", "EVENT", "CLEANING", "VIP_RESERVE", "EQUIPMENT_FAILURE", "OTHER"]),
  description: z.string().optional(),
})
.refine((d) => new Date(d.start_time) >= new Date(), {
  message: "زمان شروع نمی‌تواند در گذشته باشد",
  path: ["start_time"],
})
.refine((d) => new Date(d.end_time) >= new Date(), {
  message: "زمان پایان نمی‌تواند در گذشته باشد",
  path: ["end_time"],
})
.refine((d) => new Date(d.end_time) > new Date(d.start_time), {
  message: "زمان پایان باید بعد از شروع باشد",
  path: ["end_time"],
});
type BlockFormValues = z.infer<typeof blockSchema>;

const zoneOptions = [
  { value: "NORTH", label: "بخش شمالی" },
  { value: "SOUTH", label: "بخش جنوبی" },
  { value: "WEST", label: "بخش غربی" },
  { value: "EAST", label: "بخش شرقی" },
];
const floorOptions = [
  { value: "GROUND", label: "همکف" },
  { value: "FLOOR_1", label: "طبقه ۱" },
  { value: "FLOOR_2", label: "طبقه ۲" },
  { value: "BASEMENT_1", label: "منفی ۱" },
  { value: "BASEMENT_2", label: "منفی ۲" },
];
const typeOptions = [
  { value: "NORMAL", label: "عادی" },
  { value: "GUEST", label: "مهمان" },
  { value: "MANAGERS", label: "مدیران" },
  { value: "DISABLED", label: "معلولین" },
  { value: "MOTORCYCLE", label: "موتور" },
  { value: "ELECTRIC", label: "برقی" },
  { value: "LOADING", label: "بارگیری" },
  { value: "EMERGENCY", label: "اضطراری" },
];
const reasonOptions = [
  { value: "REPAIR", label: "تعمیرات" },
  { value: "EVENT", label: "رویداد" },
  { value: "CLEANING", label: "نظافت" },
  { value: "VIP_RESERVE", label: "رزرو VIP" },
  { value: "EQUIPMENT_FAILURE", label: "خرابی" },
  { value: "OTHER", label: "سایر" },
];

function ManagerParkingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"spaces" | "blocks">("spaces");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ParkingSpace | null>(null);
  const [confirmDeleteBlock, setConfirmDeleteBlock] = useState<ParkingBlock | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<ParkingSpace | null>(null);

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: () => parkingApi.getSpaces(),
  });

  const { data: blocks, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ["parking-blocks"],
    queryFn: () => parkingApi.getBlocks(),
  });

  const spaceForm = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
  });

  const blockForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
  });

  // 👈 استخراج کنترل برای فرم انسداد
  const { control: blockControl } = blockForm;

  const createMutation = useMutation({
    mutationFn: parkingApi.createSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("جایگاه ثبت شد");
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "خطا"),
  });

  const updateMutation = useMutation({
    mutationFn: (d: SpaceFormValues) => parkingApi.updateSpace(editingSpace!.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("ذخیره شد");
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "خطا"),
  });

  const deleteMutation = useMutation({
    mutationFn: parkingApi.deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("حذف شد");
      setConfirmDelete(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (s: ParkingSpace) => parkingApi.updateSpace(s.id, { is_active: !s.is_active }),
    onSuccess: (_, s) => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success(s.is_active ? "غیرفعال شد" : "فعال شد");
      setConfirmToggle(null);
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (d: BlockFormValues) =>
      parkingApi.createBlock({
        parking_space: d.parking_space,
        start_time: d.start_time,
        end_time: d.end_time,
        reason: d.reason,
        description: d.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-blocks"] });
      toast.success("انسداد ثبت شد");
      setIsBlockModalOpen(false);
      blockForm.reset();
    },
    onError: (e: any) => {
      const data = e.response?.data;
      let msg = "خطا در ثبت انسداد";
      if (data) {
        if (data.start_time) msg = data.start_time[0];
        else if (data.end_time) msg = data.end_time[0];
        else if (data.parking_space) msg = data.parking_space[0];
        else if (data.detail) msg = data.detail;
      }
      toast.error(msg);
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: parkingApi.deleteBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-blocks"] });
      toast.success("حذف شد");
      setConfirmDeleteBlock(null);
    },
  });

  const openCreateModal = () => {
    setEditingSpace(null);
    spaceForm.reset({ zone: "NORTH", floor: "GROUND", space_type: "NORMAL", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (s: ParkingSpace) => {
    setEditingSpace(s);
    spaceForm.reset({
      zone: s.zone,
      floor: s.floor,
      space_type: s.space_type,
      description: s.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpace(null);
  };

  const openBlockModal = () => {
    blockForm.reset({
      parking_space: "",
      start_time: "",
      end_time: "",
      reason: "REPAIR",
      description: "",
    });
    setIsBlockModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="مدیریت پارکینگ"
        subtitle={`${spaces?.length || 0} جایگاه · ${spaces?.filter((s) => s.is_active).length || 0} فعال`}
        action={
          activeTab === "spaces" ? (
            <Button onClick={openCreateModal}>
              <Plus size={16} /> جایگاه جدید
            </Button>
          ) : (
            <Button onClick={openBlockModal}>
              <Plus size={16} /> انسداد جدید
            </Button>
          )
        }
        toolbar={
          <div className="flex h-full gap-1 rounded-xl bg-gray-100 p-1 dark:bg-[#2c2c2e]">
            <button
              onClick={() => setActiveTab("spaces")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "spaces"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-[#1c1c1e] dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <ParkingSquare size={14} />
              جایگاه‌ها
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "blocks"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-[#1c1c1e] dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Ban size={14} />
              انسدادها
            </button>
          </div>
        }
      />

      {activeTab === "spaces" ? (
        isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
            ))}
          </div>
        ) : !spaces?.length ? (
          <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
              <ParkingSquare size={28} />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              جایگاهی ثبت نشده
            </h3>
            <Button onClick={openCreateModal} className="mt-4">
              <Plus size={16} /> ایجاد جایگاه
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {spaces.map((space) => {
              const hasActiveBlock = blocks?.some(
                (b) =>
                  b.parking_space === space.id &&
                  new Date(b.start_time) <= new Date() &&
                  new Date(b.end_time) > new Date()
              );

              return (
                <div key={space.id} className="rounded-2xl bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                      {zoneLabels[space.zone] || space.zone} · {floorLabels[space.floor] || space.floor}
                    </p>
                    {space.is_active ? (
                      <Unlock size={12} className="text-[#34c759] dark:text-[#30d158]" />
                    ) : (
                      <Lock size={12} className="text-gray-400" />
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-gray-500" dir="ltr">
                    #{formatSpaceId(space.code)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300">
                      {typeOptions.find((t) => t.value === space.space_type)?.label}
                    </span>
                    {hasActiveBlock && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
                        مسدود
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-1">
                    <button
                      onClick={() => setConfirmToggle(space)}
                      className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:text-gray-400 dark:hover:bg-[#3a3a3c]"
                    >
                      <Power size={13} />
                    </button>
                    <button
                      onClick={() => openEditModal(space)}
                      className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:bg-[#2c2c2e] dark:text-gray-400 dark:hover:bg-[#3a3a3c]"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(space)}
                      className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-1.5 text-[#ff3b30] transition-colors hover:bg-red-50 dark:bg-[#2c2c2e] dark:hover:bg-[#ff453a]/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : isLoadingBlocks ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : !blocks?.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <Ban size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            انسدادی ثبت نشده
          </h3>
          <Button onClick={openBlockModal} className="mt-4">
            <Plus size={16} /> ایجاد انسداد
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => {
            const space = spaces?.find((s) => s.id === block.parking_space);
            const now = new Date();
            const start = new Date(block.start_time);
            const end = new Date(block.end_time);
            const isActive = start <= now && end > now;
            const isPast = end <= now;

            return (
              <div key={block.id} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {space ? `${zoneLabels[space.zone] || space.zone} · ${floorLabels[space.floor] || space.floor} · ${formatSpaceId(space.code)}` : "—"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isActive
                            ? "bg-red-50 text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]"
                            : isPast
                              ? "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500"
                              : "bg-amber-50 text-[#ff9500] dark:bg-[#ff9f0a]/10 dark:text-[#ff9f0a]"
                        }`}
                      >
                        {isActive ? "فعال" : isPast ? "پایان یافته" : "در آینده"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                      <p>دلیل: {reasonOptions.find((r) => r.value === block.reason)?.label}</p>
                      <p dir="ltr" className="text-[11px]">
                        {start.toLocaleString("fa-IR")} → {end.toLocaleString("fa-IR")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteBlock(block)}
                    className="rounded-lg p-2 text-[#ff3b30] transition-colors hover:bg-red-50 dark:hover:bg-[#ff453a]/10"
                  >
                    <Trash2 size={16} />
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
        title={editingSpace ? "ویرایش جایگاه" : "جایگاه جدید"}
      >
        <form
          onSubmit={spaceForm.handleSubmit((d) =>
            editingSpace ? updateMutation.mutate(d) : createMutation.mutate(d)
          )}
          className="space-y-3"
        >
          <Select label="بخش" options={zoneOptions} error={spaceForm.formState.errors.zone?.message} {...spaceForm.register("zone")} />
          <Select label="طبقه" options={floorOptions} error={spaceForm.formState.errors.floor?.message} {...spaceForm.register("floor")} />
          <Select label="نوع" options={typeOptions} error={spaceForm.formState.errors.space_type?.message} {...spaceForm.register("space_type")} />
          <Input label="توضیحات (اختیاری)" {...spaceForm.register("description")} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingSpace ? "ذخیره" : "ثبت"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="انسداد جدید"
      >
        <form
          onSubmit={blockForm.handleSubmit((d) => createBlockMutation.mutate(d))}
          className="space-y-3"
        >
          <Select
            label="جایگاه"
            options={spaces?.map((s) => ({ value: s.id, label: spaceLabel(s) })) || []}
            error={blockForm.formState.errors.parking_space?.message}
            {...blockForm.register("parking_space")}
          />
          <Select
            label="دلیل"
            options={reasonOptions}
            error={blockForm.formState.errors.reason?.message}
            {...blockForm.register("reason")}
          />

          {/* 👇 استفاده از PersianDatePicker */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Controller
              name="start_time"
              control={blockControl}
              render={({ field, fieldState }) => (
                <PersianDatePicker
                  label="از"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="end_time"
              control={blockControl}
              render={({ field, fieldState }) => (
                <PersianDatePicker
                  label="تا"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <Input label="توضیحات (اختیاری)" {...blockForm.register("description")} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={createBlockMutation.isPending}>
              {createBlockMutation.isPending ? "..." : "ثبت"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsBlockModalOpen(false)} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="حذف جایگاه"
        description={`آیا جایگاه «${confirmDelete ? `${zoneLabels[confirmDelete.zone]} · ${floorLabels[confirmDelete.floor]}` : ""}» حذف شود؟`}
        confirmText="حذف"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleStatusMutation.mutate(confirmToggle)}
        title="تغییر وضعیت"
        description={`آیا ${confirmToggle?.is_active ? "غیرفعال" : "فعال"} کردن جایگاه «${confirmToggle ? `${zoneLabels[confirmToggle.zone]} · ${floorLabels[confirmToggle.floor]}` : ""}» مطمئنید؟`}
        confirmText="تایید"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteBlock}
        onClose={() => setConfirmDeleteBlock(null)}
        onConfirm={() => confirmDeleteBlock && deleteBlockMutation.mutate(confirmDeleteBlock.id)}
        title="حذف انسداد"
        description="آیا این انسداد حذف شود؟"
        confirmText="حذف"
        variant="danger"
        isLoading={deleteBlockMutation.isPending}
      />
    </div>
  );
}

export default ManagerParkingPage;