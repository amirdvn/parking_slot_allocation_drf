// src/features/parking/pages/RequestsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import { vehicleApi } from "../../vehicles/api";
import type { RequestStatus } from "../../../types/parking";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import PageHeader from "../../../components/shared/PageHeader";

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
}).refine((d) => new Date(d.end_time) > new Date(d.start_time), {
  message: "زمان پایان باید بعد از شروع باشد",
  path: ["end_time"],
});
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["parking-requests"],
    queryFn: parkingApi.getMyRequests,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.getVehicles,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  const selectedVehicleId = watch("vehicle");

  // 👇 ساده و امن
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
      toast.error(error.response?.data?.parking_space?.[0] || error.response?.data?.detail || "خطا در ثبت");
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
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">هنوز درخواستی ثبت نکرده‌اید</h3>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4"><Plus size={16} /> ثبت درخواست</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white">#{req.id}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig[req.status]?.className}`}>
                  {statusConfig[req.status]?.label || req.status}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                <p>خودرو: <span className="font-medium text-gray-900 dark:text-white" dir="ltr">{vehicles?.find((v) => v.id === req.vehicle)?.plate_number || "---"}</span></p>
                <p dir="ltr">{new Date(req.start_time).toLocaleString("fa-IR")} → {new Date(req.end_time).toLocaleString("fa-IR")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="درخواست جدید">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select
            label="خودرو"
            options={vehicles?.map((v) => ({ value: String(v.id), label: v.plate_number })) || []}
            error={errors.vehicle?.message}
            {...register("vehicle")}
          />

          <Select
            label="جایگاه"
            options={spaces?.map((s) => ({ value: s.id, label: `${s.code} (${s.floor})` })) || []}
            error={errors.parking_space?.message}
            disabled={!selectedVehicleId}
            {...register("parking_space")}
          />

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
    </div>
  );
}

export default RequestsPage;