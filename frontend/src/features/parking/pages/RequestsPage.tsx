import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, XCircle, Clock } from "lucide-react";
import { parkingApi } from "../api";
import { vehicleApi } from "../../vehicles/api";
import type { ParkingRequest, RequestStatus } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";

// --- تنظیمات وضعیت‌ها ---
const statusMap: Record<RequestStatus, { label: string; color: string }> = {
  PENDING: { label: "در انتظار بررسی", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "تایید شده", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "رد شده", color: "bg-red-100 text-red-700" },
  CANCELED: { label: "لغو شده", color: "bg-gray-100 text-gray-700" },
  EXPIRED: { label: "منقضی شده", color: "bg-gray-100 text-gray-500" },
  IN_USE: { label: "در حال استفاده", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "تکمیل شده", color: "bg-emerald-100 text-emerald-700" },
  NEEDS_REVIEW: { label: "نیازمند بررسی", color: "bg-orange-100 text-orange-700" },
};

// --- اسکیمای فرم ثبت درخواست ---
const requestSchema = z.object({
  vehicle: z.string().min(1, "انتخاب خودرو الزامی است"),
  parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
  description: z.string().optional(),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: "زمان پایان باید بعد از زمان شروع باشد",
  path: ["end_time"],
});
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestsPage() {
  const queryClient = useQueryClient();

  // Stateهای مربوط به مودال‌ها
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelingRequest, setCancelingRequest] = useState<ParkingRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  // دریافت داده‌ها
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

  // فرم ثبت درخواست
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  // Mutation ثبت
  const createMutation = useMutation({
    mutationFn: (data: RequestFormValues) => {
      // تبدیل تاریخ‌های محلی به فرمت ISO برای بک‌اند
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
      setIsCreateOpen(false);
      reset();
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      setServerError(errData?.parking_space?.[0] || errData?.start_time?.[0] || errData?.detail || "خطایی رخ داد");
    },
  });

  // Mutation لغو
  const cancelMutation = useMutation({
    mutationFn: () => parkingApi.cancelRequest(cancelingRequest!.id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-requests"] });
      setCancelingRequest(null);
      setCancelReason("");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "خطا در لغو درخواست");
    },
  });

  const handleCreateSubmit = (data: RequestFormValues) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  if (isLoadingRequests) return <div className="p-4">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">درخواست‌های من</h1>
        <Button onClick={() => { setIsCreateOpen(true); setServerError(null); reset(); }} className="gap-2">
          <Plus size={18} /> ثبت درخواست جدید
        </Button>
      </div>

      {/* جدول/لیست درخواست‌ها */}
      {requests?.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          هنوز هیچ درخواستی ثبت نکرده‌اید.
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
              {requests?.map((req) => (
                <tr key={req.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-mono">#{req.id}</td>
                  <td className="px-4 py-3">{vehicles?.find(v => v.id === req.vehicle)?.plate_number || req.vehicle}</td>
                  <td className="px-4 py-3">{spaces?.find(s => s.id === req.parking_space)?.code || req.parking_space}</td>
                  <td className="px-4 py-3 text-xs" dir="ltr">
                    {new Date(req.start_time).toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${statusMap[req.status]?.color || "bg-gray-100"}`}>
                      {statusMap[req.status]?.label || req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(req.status === "PENDING" || req.status === "APPROVED") && (
                      <button
                        onClick={() => setCancelingRequest(req)}
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
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="ثبت درخواست پارکینگ">
        <form onSubmit={handleSubmit(handleCreateSubmit)} className="flex flex-col gap-4">
          <Select
            label="انتخاب خودرو"
            options={vehicles?.map(v => ({ value: String(v.id), label: v.plate_number })) || []}
            error={errors.vehicle?.message}
            {...register("vehicle")}
          />

          <Select
            label="انتخاب جایگاه"
            options={spaces?.map(s => ({ value: s.id, label: `${s.code} (${s.floor})` })) || []}
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

          {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{serverError}</div>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "در حال ثبت..." : "ثبت درخواست"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال لغو درخواست */}
      <Modal isOpen={!!cancelingRequest} onClose={() => setCancelingRequest(null)} title="لغو درخواست">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            آیا از لغو درخواست <span className="font-bold">#{cancelingRequest?.id}</span> مطمئن هستید؟ لطفاً دلیل لغو را وارد کنید.
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
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              تایید و لغو
            </Button>
            <Button type="button" variant="outline" onClick={() => setCancelingRequest(null)} className="flex-1">
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RequestsPage;