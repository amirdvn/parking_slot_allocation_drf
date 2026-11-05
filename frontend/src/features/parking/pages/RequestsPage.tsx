// src/features/parking/pages/RequestsPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, XCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import { vehicleApi } from "../../vehicles/api";
import type { ParkingRequest, RequestStatus } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import TableToolbar from "../../../components/ui/TableToolbar";
import EmptyState from "../../../components/ui/EmptyState";
import { TableSkeleton } from "../../../components/ui/Skeleton";

// --- تنظیمات وضعیت‌ها ---
const statusMap: Record<RequestStatus, { label: string; color: string }> = {
  PENDING: { label: "در انتظار بررسی", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  APPROVED: { label: "تایید شده", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  REJECTED: { label: "رد شده", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELED: { label: "لغو شده", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  EXPIRED: { label: "منقضی شده", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
  IN_USE: { label: "در حال استفاده", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "تکمیل شده", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  NEEDS_REVIEW: { label: "نیازمند بررسی", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

// --- فیلتر وضعیت ---
const statusFilterOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار بررسی" },
  { value: "APPROVED", label: "تایید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "CANCELED", label: "لغو شده" },
  { value: "IN_USE", label: "در حال استفاده" },
  { value: "COMPLETED", label: "تکمیل شده" },
];

// --- اسکیمای فرم ثبت درخواست ---
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

  // 👇 stateهای جستجو و فیلتر
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

  // 👇 فیلتر کردن داده‌ها
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">درخواست‌های من</h1>
        <Button
          onClick={() => {
            setIsCreateOpen(true);
            setServerError(null);
            reset();
          }}
          className="gap-2"
        >
          <Plus size={18} /> ثبت درخواست جدید
        </Button>
      </div>

      {/* 👇 نوار ابزار جستجو و فیلتر */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو بر اساس شناسه، پلاک یا کد جایگاه..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusFilterOptions}
        filterLabel="فیلتر وضعیت"
        resultCount={filteredRequests.length}
        totalCount={requests?.length}
      />

      {/* 👇 جدول با Skeleton و EmptyState */}
      {isLoadingRequests ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={<ClipboardList size={48} />}
            title={
              searchQuery || statusFilter
                ? "درخواستی یافت نشد"
                : "هنوز درخواستی ثبت نکرده‌اید"
            }
            description={
              searchQuery || statusFilter
                ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد. فیلترها را پاک کنید."
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
                  className="gap-2"
                >
                  <Plus size={18} /> ثبت درخواست جدید
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-right text-sm">
            <thead className="bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">خودرو</th>
                <th className="px-4 py-3 font-medium">جایگاه</th>
                <th className="px-4 py-3 font-medium">زمان شروع</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-mono">#{req.id}</td>
                  <td className="px-4 py-3">
                    {vehicles?.find((v) => v.id === req.vehicle)?.plate_number || req.vehicle}
                  </td>
                  <td className="px-4 py-3">
                    {spaces?.find((s) => s.id === req.parking_space)?.code || req.parking_space}
                  </td>
                  <td className="px-4 py-3 text-xs" dir="ltr">
                    {new Date(req.start_time).toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        statusMap[req.status]?.color || "bg-gray-100"
                      }`}
                    >
                      {statusMap[req.status]?.label || req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(req.status === "PENDING" || req.status === "APPROVED") && (
                      <button
                        onClick={() => {
                          setCancelingRequest(req);
                          setCancelReason("");
                        }}
                        className="flex items-center gap-1 text-xs text-danger hover:underline"
                      >
                        <XCircle size={14} /> لغو
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* مودال ثبت درخواست */}
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
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{serverError}</div>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
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

      {/* مودال دلیل لغو */}
      <Modal
        isOpen={!!cancelingRequest}
        onClose={() => setCancelingRequest(null)}
        title="لغو درخواست"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            آیا از لغو درخواست <span className="font-bold">#{cancelingRequest?.id}</span> مطمئن
            هستید؟ لطفاً دلیل لغو را وارد کنید.
          </p>
          <Input
            label="دلیل لغو"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="مثلا: تغییر برنامه"
          />
          <div className="flex gap-3 mt-2">
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
              بستن
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