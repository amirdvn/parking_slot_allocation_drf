// src/features/parking/pages/RequestsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, ClipboardList, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import { vehicleApi } from "../../vehicles/api";
import type { ParkingRequest, RequestStatus } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";
import { spaceLabel, formatPlate } from "../../../lib/parking-format";

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  PENDING: { label: "در انتظار", className: "bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300" },
  APPROVED: { label: "تایید شده", className: "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]" },
  REJECTED: { label: "رد شده", className: "bg-red-50 text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]" },
  CANCELED: { label: "لغو شده", className: "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500" },
  EXPIRED: { label: "منقضی", className: "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500" },
  IN_USE: { label: "در حال استفاده", className: "bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]" },
  COMPLETED: { label: "تکمیل شده", className: "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]" },
  NEEDS_REVIEW: { label: "نیازمند بررسی", className: "bg-gray-100 text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300" },
};

const requestSchema = z.object({
  vehicle: z.string().min(1, "خودرو الزامی است"),
  parking_space: z.string().min(1, "جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
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
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [cancelingRequest, setCancelingRequest] = useState<ParkingRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["parking-requests"],
    queryFn: parkingApi.getMyRequests,
  });

  // 👇 فیلتر کردن خودروهای غیرفعال در همین مرحله
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.getVehicles,
    select: (data) => data?.filter((v) => v.is_active),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  const selectedVehicleId = watch("vehicle");

  const { data: spaces } = useQuery({
    queryKey: ["parking-spaces", selectedVehicleId],
    queryFn: () => parkingApi.getSpaces(selectedVehicleId ? Number(selectedVehicleId) : undefined),
    enabled: !!selectedVehicleId,
  });

  useEffect(() => {
    if (selectedVehicleId) {
      setValue("parking_space", "");
    }
  }, [selectedVehicleId, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: RequestFormValues) => {
      return parkingApi.createRequest({
        vehicle: Number(data.vehicle),
        parking_space: data.parking_space,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-requests"] });
      toast.success("درخواست ثبت شد");
      setIsCreateOpen(false);
      reset();
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = "خطا در ثبت";
      if (data) {
        if (data.start_time) msg = data.start_time[0];
        else if (data.end_time) msg = data.end_time[0];
        else if (data.parking_space) msg = data.parking_space[0];
        else if (data.vehicle) msg = data.vehicle[0];
        else if (data.detail) msg = data.detail;
      }
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => parkingApi.cancelRequest(cancelingRequest!.id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-requests"] });
      toast.success("درخواست لغو شد");
      setCancelingRequest(null);
      setCancelReason("");
      setConfirmCancel(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا در لغو درخواست");
      setConfirmCancel(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="درخواست‌های من"
        subtitle={`${requests?.length || 0} درخواست`}
        action={
          <Button onClick={() => { setIsCreateOpen(true); reset(); }}>
            <Plus size={16} /> درخواست جدید
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : !requests?.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <ClipboardList size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            هنوز درخواستی ثبت نکرده‌اید
          </h3>
          <p className="mt-1 text-[13px] text-gray-500">
            اولین درخواست خود را ثبت کنید
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
            <Plus size={16} /> ثبت درخواست
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const canCancel = req.status === "PENDING" || req.status === "APPROVED";

            return (
              <div key={req.id} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white">
                        #{req.id}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig[req.status]?.className}`}>
                        {statusConfig[req.status]?.label || req.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                      <p>
                        خودرو:{" "}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {/* نکته: برای جلوگیری از undefined در اینجا از تمام ماشین‌ها استفاده می‌کنیم */}
                          {formatPlate(
                            requests?.find((r) => r.vehicle === req.vehicle)?.vehicle?.plate_number ||
                            `خودرو ${req.vehicle}`,
                            "CAR"
                          )}
                        </span>
                      </p>
                      <p dir="ltr">
                        {new Date(req.start_time).toLocaleString("fa-IR")} →{" "}
                        {new Date(req.end_time).toLocaleString("fa-IR")}
                      </p>
                      {req.description && (
                        <p className="text-[11px]">توضیحات: {req.description}</p>
                      )}
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => {
                        setCancelingRequest(req);
                        setCancelReason("");
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-[#ff3b30] transition-colors hover:bg-red-100 dark:bg-[#ff453a]/10 dark:text-[#ff453a] dark:hover:bg-[#ff453a]/20"
                    >
                      <XCircle size={14} />
                      لغو
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="درخواست جدید">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select
            label="خودرو"
            options={vehicles?.map((v) => ({ value: String(v.id), label: formatPlate(v.plate_number, v.vehicle_type) })) || []}
            error={errors.vehicle?.message}
            {...register("vehicle")}
          />

          <Select
            label="جایگاه"
            options={spaces?.map((s) => ({ value: s.id, label: spaceLabel(s) })) || []}
            error={errors.parking_space?.message}
            disabled={!selectedVehicleId}
            {...register("parking_space")}
          />
          {!selectedVehicleId && (
            <p className="text-xs text-amber-500">ابتدا خودرو را انتخاب کنید.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input type="datetime-local" label="شروع" error={errors.start_time?.message} {...register("start_time")} />
            <Input type="datetime-local" label="پایان" error={errors.end_time?.message} {...register("end_time")} />
          </div>
          <Input label="توضیحات" {...register("description")} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "..." : "ثبت"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!cancelingRequest}
        onClose={() => setCancelingRequest(null)}
        title="لغو درخواست"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>
              درخواست <span className="font-bold">#{cancelingRequest?.id}</span> لغو خواهد شد. لطفاً دلیل را وارد کنید.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              دلیل لغو (الزامی)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="مثلاً: تغییر برنامه، لغو سفر و..."
              rows={3}
              className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#007aff] dark:bg-[#1c1c1e] dark:text-white dark:focus:bg-[#2c2c2e] dark:focus:ring-[#0a84ff]"
            />
          </div>

          <div className="flex gap-2">
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
              className="flex-1"
              onClick={() => setCancelingRequest(null)}
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
        title="لغو قطعی"
        description={`آیا از لغو درخواست #${cancelingRequest?.id} مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="بله، لغو کن"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

export default RequestsPage;