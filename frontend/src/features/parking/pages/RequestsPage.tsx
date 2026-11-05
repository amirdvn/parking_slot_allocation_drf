// src/features/parking/pages/RequestsPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  XCircle,
  ClipboardList,
  Car,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import { vehicleApi } from "../../vehicles/api";
import type { ParkingRequest, RequestStatus } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

// --- تنظیمات وضعیت ---
const statusConfig: Record<
  RequestStatus,
  { label: string; color: string; gradient: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "در انتظار",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    gradient: "from-yellow-400 to-amber-500",
    icon: <Clock size={14} />,
  },
  APPROVED: {
    label: "تایید شده",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    gradient: "from-emerald-400 to-green-500",
    icon: <CheckCircle size={14} />,
  },
  REJECTED: {
    label: "رد شده",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    gradient: "from-red-400 to-rose-500",
    icon: <XCircle size={14} />,
  },
  CANCELED: {
    label: "لغو شده",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    gradient: "from-gray-400 to-gray-500",
    icon: <XCircle size={14} />,
  },
  EXPIRED: {
    label: "منقضی",
    color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    gradient: "from-gray-300 to-gray-400",
    icon: <Clock size={14} />,
  },
  IN_USE: {
    label: "در حال استفاده",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gradient: "from-blue-400 to-indigo-500",
    icon: <Car size={14} />,
  },
  COMPLETED: {
    label: "تکمیل شده",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    gradient: "from-teal-400 to-cyan-500",
    icon: <CheckCircle size={14} />,
  },
  NEEDS_REVIEW: {
    label: "نیازمند بررسی",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    gradient: "from-orange-400 to-amber-500",
    icon: <AlertCircle size={14} />,
  },
};

const statusFilterOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار بررسی" },
  { value: "APPROVED", label: "تایید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "CANCELED", label: "لغو شده" },
  { value: "IN_USE", label: "در حال استفاده" },
  { value: "COMPLETED", label: "تکمیل شده" },
];

const requestSchema = z
  .object({
    vehicle: z.string().min(1, "انتخاب خودرو الزامی است"),
    parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
    start_time: z.string().min(1, "زمان شروع الزامی است"),
    end_time: z.string().min(1, "زمان پایان الزامی است"),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "زمان پایان باید بعد از زمان شروع باشد",
    path: ["end_time"],
  });
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestsPage() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelingRequest, setCancelingRequest] = useState<ParkingRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["parking-requests"],
    queryFn: parkingApi.getMyRequests,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.getVehicles,
  });

  const { data: spaces } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: parkingApi.getSpaces,
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((req) => {
      const vehiclePlate = vehicles?.find((v) => v.id === req.vehicle)?.plate_number || "";
      const spaceCode = spaces?.find((s) => s.id === req.parking_space)?.code || "";

      const matchesSearch =
        !searchQuery ||
        String(req.id).includes(searchQuery) ||
        vehiclePlate.includes(searchQuery) ||
        spaceCode.includes(searchQuery);

      const matchesStatus = !statusFilter || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, vehicles, spaces, searchQuery, statusFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: RequestFormValues) => {
      const payload = {
        vehicle: Number(data.vehicle),
        parking_space: data.parking_space,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        description: data.description,
      };
      return parkingApi.createRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-requests"] });
      toast.success("درخواست با موفقیت ثبت شد");
      setIsCreateOpen(false);
      reset();
      setServerError(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      const msg =
        errData?.parking_space?.[0] ||
        errData?.start_time?.[0] ||
        errData?.detail ||
        "خطایی رخ داد";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => parkingApi.cancelRequest(cancelingRequest!.id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-requests"] });
      toast.success("درخواست با موفقیت لغو شد");
      setCancelingRequest(null);
      setCancelReason("");
      setConfirmCancel(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا در لغو درخواست");
      setConfirmCancel(false);
    },
  });

  const handleCreateSubmit = (data: RequestFormValues) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  const stats = useMemo(() => {
    if (!requests) return { total: 0, pending: 0, approved: 0 };
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-600 via-teal-700 to-primary-800 p-6 text-white shadow-xl sm:p-8">
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
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">درخواست‌های من</h1>
              <p className="mt-1 text-sm text-white/70">
                مدیریت و پیگیری درخواست‌های پارکینگ
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setIsCreateOpen(true);
              setServerError(null);
              reset();
            }}
            className="bg-white text-emerald-700 shadow-lg hover:bg-white/90"
          >
            <Plus size={18} /> ثبت درخواست جدید
          </Button>
        </div>

        {/* Mini Stats */}
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-[10px] text-white/70">کل</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-[10px] text-white/70">در انتظار</p>
            <p className="text-lg font-bold text-yellow-300">{stats.pending}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-[10px] text-white/70">تایید شده</p>
            <p className="text-lg font-bold text-green-300">{stats.approved}</p>
          </div>
        </div>
      </div>

      {/* 👇 Toolbar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="جستجو بر اساس شناسه، پلاک یا کد جایگاه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 👇 Content */}
      {isLoadingRequests ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            icon={<ClipboardList size={48} />}
            title={
              searchQuery || statusFilter
                ? "درخواستی یافت نشد"
                : "هنوز درخواستی ثبت نکرده‌اید"
            }
            description={
              searchQuery || statusFilter
                ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد."
                : "اولین درخواست پارکینگ خود را ثبت کنید."
            }
            action={
              searchQuery || statusFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setIsCreateOpen(true);
                    reset();
                  }}
                >
                  <Plus size={18} /> ثبت درخواست جدید
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRequests.map((req) => {
            const config = statusConfig[req.status];
            const vehicle = vehicles?.find((v) => v.id === req.vehicle);
            const space = spaces?.find((s) => s.id === req.parking_space);
            const canCancel = req.status === "PENDING" || req.status === "APPROVED";

            return (
              <div
                key={req.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-lg"
              >
                {/* نوار بالای کارت بر اساس وضعیت */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${config.gradient}`} />

                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">درخواست</p>
                    <p className="font-mono text-lg font-bold text-secondary-900">
                      #{req.id}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${config.color}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                </div>

                {/* Info */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                      <Car size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-mono font-bold text-secondary-900" dir="ltr">
                      {vehicle?.plate_number || "---"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                      <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-secondary-900">
                      جایگاه: <span className="font-bold">{space?.code || "---"}</span>
                      {space && (
                        <span className="text-text-secondary text-xs mr-1">
                          ({space.floor})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar size={14} />
                    <div dir="ltr">
                      <p>از {new Date(req.start_time).toLocaleString("fa-IR")}</p>
                      <p>تا {new Date(req.end_time).toLocaleString("fa-IR")}</p>
                    </div>
                  </div>

                  {req.description && (
                    <div className="rounded-lg bg-background/50 p-2 text-xs text-text-secondary">
                      <span className="font-medium">توضیحات: </span>
                      {req.description}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canCancel && (
                  <div className="border-t border-border pt-3">
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => {
                        setCancelingRequest(req);
                        setCancelReason("");
                      }}
                    >
                      <XCircle size={16} /> لغو درخواست
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 👇 Modal ثبت درخواست */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت درخواست پارکینگ"
      >
        <form onSubmit={handleSubmit(handleCreateSubmit)} className="flex flex-col gap-4">
          <Select
            label="انتخاب خودرو"
            options={vehicles?.map((v) => ({ value: String(v.id), label: v.plate_number })) || []}
            error={errors.vehicle?.message}
            {...register("vehicle")}
          />

          <Select
            label="انتخاب جایگاه"
            options={spaces?.map((s) => ({ value: s.id, label: `${s.code} (${s.floor})` })) || []}
            error={errors.parking_space?.message}
            {...register("parking_space")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="زمان شروع"
              error={errors.start_time?.message}
              {...register("start_time")}
            />
            <Input
              type="datetime-local"
              label="زمان پایان"
              error={errors.end_time?.message}
              {...register("end_time")}
            />
          </div>

          <Input label="توضیحات (اختیاری)" {...register("description")} />

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-l from-emerald-600 to-green-600 shadow-md shadow-emerald-500/20"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "در حال ثبت..." : "ثبت درخواست"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      {/* 👇 Modal دلیل لغو */}
      <Modal
        isOpen={!!cancelingRequest}
        onClose={() => setCancelingRequest(null)}
        title="لغو درخواست"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                درخواست <span className="font-bold">#{cancelingRequest?.id}</span> لغو خواهد شد. دلیل را وارد کنید.
              </span>
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              دلیل لغو (الزامی)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="مثلا: تغییر برنامه..."
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => setConfirmCancel(true)}
              disabled={!cancelReason.trim()}
            >
              تایید و لغو
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelingRequest(null)}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="لغو قطعی درخواست"
        description={`آیا از لغو قطعی درخواست #${cancelingRequest?.id} مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="بله، لغو کن"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

export default RequestsPage;