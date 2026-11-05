import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  ParkingSquare,
  Ban,
  Clock,
  Lock,
  Unlock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../../parking/api";
import type { ParkingSpace, ParkingBlock } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";
import TableToolbar from "../../../components/ui/TableToolbar";

// --- اسکیمای فرم جایگاه ---
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

// --- اسکیمای فرم انسداد ---
const blockSchema = z.object({
  parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
  reason: z.enum(["REPAIR", "EVENT", "CLEANING", "VIP_RESERVE", "EQUIPMENT_FAILURE", "OTHER"]),
  description: z.string().optional(),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: "زمان پایان باید بعد از زمان شروع باشد",
  path: ["end_time"],
});
type BlockFormValues = z.infer<typeof blockSchema>;

// --- مپرها ---
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
  { value: "EVENT", label: "رویداد سازمانی" },
  { value: "CLEANING", label: "نظافت" },
  { value: "VIP_RESERVE", label: "رزرو VIP" },
  { value: "EQUIPMENT_FAILURE", label: "خرابی تجهیزات" },
  { value: "OTHER", label: "سایر" },
];

// رنگ‌بندی بر اساس نوع جایگاه
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  NORMAL: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  GUEST: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  MANAGERS: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  DISABLED: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800" },
  MOTORCYCLE: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  ELECTRIC: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  LOADING: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-700 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
  EMERGENCY: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
};

function ManagerParkingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"spaces" | "blocks">("spaces");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ParkingSpace | null>(null);
  const [confirmDeleteBlock, setConfirmDeleteBlock] = useState<ParkingBlock | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<ParkingSpace | null>(null);

  // فیلترها
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // دریافت داده‌ها
  const { data: spaces, isLoading } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: parkingApi.getSpaces,
  });

  const { data: blocks, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ["parking-blocks"],
    queryFn: parkingApi.getBlocks,
  });

  // فیلتر جایگاه‌ها
  const filteredSpaces = useMemo(() => {
    if (!spaces) return [];
    return spaces.filter((s) => {
      const matchesSearch =
        !searchQuery || s.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = !zoneFilter || s.zone === zoneFilter;
      const matchesType = !typeFilter || s.space_type === typeFilter;
      return matchesSearch && matchesZone && matchesType;
    });
  }, [spaces, searchQuery, zoneFilter, typeFilter]);

  // آمار
  const stats = useMemo(() => {
    if (!spaces) return { total: 0, active: 0, inactive: 0 };
    return {
      total: spaces.length,
      active: spaces.filter((s) => s.is_active).length,
      inactive: spaces.filter((s) => !s.is_active).length,
    };
  }, [spaces]);

  // فرم جایگاه
  const spaceForm = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
  });

  // فرم انسداد
  const blockForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: parkingApi.createSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("جایگاه با موفقیت ثبت شد");
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "خطا در ثبت جایگاه";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SpaceFormValues) => parkingApi.updateSpace(editingSpace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("تغییرات ذخیره شد");
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "خطا در ویرایش";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: parkingApi.deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success("جایگاه حذف شد");
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error("خطا در حذف جایگاه");
      setConfirmDelete(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (space: ParkingSpace) =>
      parkingApi.updateSpace(space.id, { is_active: !space.is_active }),
    onSuccess: (_, space) => {
      queryClient.invalidateQueries({ queryKey: ["parking-spaces"] });
      toast.success(space.is_active ? "جایگاه غیرفعال شد" : "جایگاه فعال شد");
      setConfirmToggle(null);
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (data: BlockFormValues) => {
      return parkingApi.createBlock({
        parking_space: data.parking_space,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        reason: data.reason,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-blocks"] });
      toast.success("انسداد با موفقیت ثبت شد");
      setIsBlockModalOpen(false);
      blockForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "خطا در ثبت انسداد");
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: parkingApi.deleteBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-blocks"] });
      toast.success("انسداد حذف شد");
      setConfirmDeleteBlock(null);
    },
  });

  const openCreateModal = () => {
    setEditingSpace(null);
    spaceForm.reset({
      zone: "NORTH",
      floor: "GROUND",
      space_type: "NORMAL",
      description: "",
    });
    setIsModalOpen(true);
    setServerError(null);
  };

  const openEditModal = (space: ParkingSpace) => {
    setEditingSpace(space);
    spaceForm.reset({
      zone: space.zone,
      floor: space.floor,
      space_type: space.space_type,
      description: space.description || "",
    });
    setIsModalOpen(true);
    setServerError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpace(null);
    setServerError(null);
  };

  const onSubmit = (data: SpaceFormValues) => {
    setServerError(null);
    if (editingSpace) updateMutation.mutate(data);
    else createMutation.mutate(data);
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

  // فیلتر انسدادها
  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
    return blocks.filter((b) => {
      if (!searchQuery) return true;
      const space = spaces?.find((s) => s.id === b.parking_space);
      return space?.code.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [blocks, searchQuery, spaces]);

  return (
    <div className="space-y-6">
      {/* 👇 Hero + Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 via-primary-700 to-primary-800 p-6 text-white shadow-xl">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/20">
              <ParkingSquare size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مدیریت پارکینگ</h1>
              <p className="mt-1 text-sm text-white/70">
                مدیریت جایگاه‌ها و انسدادهای موقت
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-xs text-white/70">کل جایگاه‌ها</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-xs text-white/70">فعال</p>
              <p className="text-xl font-bold text-emerald-300">{stats.active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => {
              setActiveTab("spaces");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "spaces"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-secondary-900"
            }`}
          >
            <ParkingSquare size={16} />
            جایگاه‌ها ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab("blocks");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "blocks"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-secondary-900"
            }`}
          >
            <Ban size={16} />
            انسدادها ({blocks?.length || 0})
          </button>
        </div>

        {activeTab === "spaces" ? (
          <Button onClick={openCreateModal}>
            <Plus size={18} /> جایگاه جدید
          </Button>
        ) : (
          <Button onClick={openBlockModal}>
            <Plus size={18} /> انسداد جدید
          </Button>
        )}
      </div>

      {/* 👇 Toolbar */}
      {activeTab === "spaces" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="جستجو بر اساس کد جایگاه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            label=""
            options={[{ value: "", label: "همه بخش‌ها" }, ...zoneOptions]}
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          />
          <Select
            label=""
            options={[{ value: "", label: "همه انواع" }, ...typeOptions]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      )}

      {activeTab === "blocks" && (
        <Input
          placeholder="جستجو بر اساس کد جایگاه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {/* 👇 Content */}
      {activeTab === "spaces" ? (
        isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface">
            <EmptyState
              icon={<ParkingSquare size={48} />}
              title={searchQuery || zoneFilter || typeFilter ? "جایگاهی یافت نشد" : "هیچ جایگاهی وجود ندارد"}
              description={
                searchQuery || zoneFilter || typeFilter
                  ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد."
                  : "اولین جایگاه پارکینگ را ایجاد کنید."
              }
              action={
                searchQuery || zoneFilter || typeFilter ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setZoneFilter("");
                      setTypeFilter("");
                    }}
                  >
                    پاک کردن فیلترها
                  </Button>
                ) : (
                  <Button onClick={openCreateModal}>
                    <Plus size={18} /> ایجاد اولین جایگاه
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSpaces.map((space) => {
              const colors = typeColors[space.space_type] || typeColors.NORMAL;
              const hasActiveBlock = blocks?.some(
                (b) =>
                  b.parking_space === space.id &&
                  new Date(b.start_time) <= new Date() &&
                  new Date(b.end_time) > new Date()
              );

              return (
                <div
                  key={space.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-surface p-4 transition-all hover:-translate-y-1 hover:shadow-xl ${
                    hasActiveBlock
                      ? "border-red-300 dark:border-red-800"
                      : space.is_active
                        ? colors.border
                        : "border-gray-200 dark:border-gray-800 opacity-75"
                  }`}
                >
                  {/* نوار بالا */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-secondary-900" dir="ltr">
                        {space.code}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {zoneOptions.find((z) => z.value === space.zone)?.label} / {floorOptions.find((f) => f.value === space.floor)?.label}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}
                    >
                      {typeOptions.find((t) => t.value === space.space_type)?.label}
                    </span>
                  </div>

                  {/* وضعیت */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {space.is_active ? (
                        <>
                          <Unlock size={12} className="text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-400">فعال</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} className="text-gray-500" />
                          <span className="text-text-secondary">غیرفعال</span>
                        </>
                      )}
                    </div>
                    {hasActiveBlock && (
                      <div className="flex items-center gap-1.5">
                        <Ban size={12} className="text-red-600" />
                        <span className="font-medium text-red-700 dark:text-red-400">مسدود</span>
                      </div>
                    )}
                    {space.requires_permission && (
                      <div className="text-amber-600 dark:text-amber-400">
                        ⚠️ نیاز به مجوز
                      </div>
                    )}
                  </div>

                  {/* دکمه‌ها */}
                  <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
                    <button
                      onClick={() => setConfirmToggle(space)}
                      className="flex-1 rounded-lg bg-background p-1.5 text-text-secondary hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
                      title="تغییر وضعیت"
                    >
                      <Power size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => openEditModal(space)}
                      className="flex-1 rounded-lg bg-background p-1.5 text-text-secondary hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                      title="ویرایش"
                    >
                      <Edit size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(space)}
                      className="flex-1 rounded-lg bg-background p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="حذف"
                    >
                      <Trash2 size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* 👇 Tabs = Blocks */
        isLoadingBlocks ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface">
            <EmptyState
              icon={<Ban size={48} />}
              title={searchQuery ? "انسدادی یافت نشد" : "هیچ انسدادی وجود ندارد"}
              description="جایگاه‌ها می‌توانند برای مدت مشخصی مسدود شوند (تعمیرات، رویداد، ...)"
              action={
                !searchQuery && (
                  <Button onClick={openBlockModal}>
                    <Plus size={18} /> ایجاد انسداد جدید
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-background text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">جایگاه</th>
                  <th className="px-4 py-3 font-medium">از تاریخ</th>
                  <th className="px-4 py-3 font-medium">تا تاریخ</th>
                  <th className="px-4 py-3 font-medium">دلیل</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBlocks.map((block) => {
                  const space = spaces?.find((s) => s.id === block.parking_space);
                  const now = new Date();
                  const start = new Date(block.start_time);
                  const end = new Date(block.end_time);
                  const isActive = start <= now && end > now;
                  const isPast = end <= now;

                  return (
                    <tr key={block.id} className="hover:bg-background/50">
                      <td className="px-4 py-3 font-mono font-bold" dir="ltr">
                        {space?.code || "---"}
                      </td>
                      <td className="px-4 py-3 text-xs" dir="ltr">
                        {start.toLocaleString("fa-IR")}
                      </td>
                      <td className="px-4 py-3 text-xs" dir="ltr">
                        {end.toLocaleString("fa-IR")}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {reasonOptions.find((r) => r.value === block.reason)?.label || block.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            isActive
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : isPast
                                ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {isActive ? "فعال" : isPast ? "پایان یافته" : "در آینده"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmDeleteBlock(block)}
                          className="text-danger hover:underline"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 👇 Modal جایگاه */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSpace ? "ویرایش جایگاه" : "افزودن جایگاه جدید"}>
        <form onSubmit={spaceForm.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select label="بخش" options={zoneOptions} error={spaceForm.formState.errors.zone?.message} {...spaceForm.register("zone")} />
          <Select label="طبقه" options={floorOptions} error={spaceForm.formState.errors.floor?.message} {...spaceForm.register("floor")} />
          <Select label="نوع جایگاه" options={typeOptions} error={spaceForm.formState.errors.space_type?.message} {...spaceForm.register("space_type")} />
          <Input label="توضیحات (اختیاری)" {...spaceForm.register("description")} />

          {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20">{serverError}</div>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingSpace ? "ذخیره تغییرات" : "ثبت جایگاه"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} className="flex-1">انصراف</Button>
          </div>
        </form>
      </Modal>

      {/* 👇 Modal انسداد */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="ایجاد انسداد جدید" size="md">
        <form onSubmit={blockForm.handleSubmit((data) => createBlockMutation.mutate(data))} className="flex flex-col gap-4">
          <Select
            label="جایگاه"
            options={spaces?.map((s) => ({ value: s.id, label: `${s.code} (${s.floor})` })) || []}
            error={blockForm.formState.errors.parking_space?.message}
            {...blockForm.register("parking_space")}
          />
          <Select
            label="دلیل انسداد"
            options={reasonOptions}
            error={blockForm.formState.errors.reason?.message}
            {...blockForm.register("reason")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              label="زمان شروع"
              error={blockForm.formState.errors.start_time?.message}
              {...blockForm.register("start_time")}
            />
            <Input
              type="datetime-local"
              label="زمان پایان"
              error={blockForm.formState.errors.end_time?.message}
              {...blockForm.register("end_time")}
            />
          </div>
          <Input label="توضیحات (اختیاری)" {...blockForm.register("description")} />

          <div className="mt-2 flex gap-3">
            <Button type="submit" className="flex-1" disabled={createBlockMutation.isPending}>
              {createBlockMutation.isPending ? "در حال ثبت..." : "ثبت انسداد"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsBlockModalOpen(false)} className="flex-1">انصراف</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="حذف جایگاه"
        description={`آیا از حذف جایگاه «${confirmDelete?.code}» مطمئن هستید؟`}
        confirmText="حذف کن"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleStatusMutation.mutate(confirmToggle)}
        title="تغییر وضعیت جایگاه"
        description={`آیا از ${confirmToggle?.is_active ? "غیرفعال" : "فعال"} کردن جایگاه «${confirmToggle?.code}» مطمئن هستید؟`}
        confirmText="بله، تغییر بده"
        variant="primary"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteBlock}
        onClose={() => setConfirmDeleteBlock(null)}
        onConfirm={() => confirmDeleteBlock && deleteBlockMutation.mutate(confirmDeleteBlock.id)}
        title="حذف انسداد"
        description="آیا از حذف این انسداد مطمئن هستید؟ جایگاه مجدداً در دسترس خواهد بود."
        confirmText="حذف کن"
        isLoading={deleteBlockMutation.isPending}
      />
    </div>
  );
}

export default ManagerParkingPage;