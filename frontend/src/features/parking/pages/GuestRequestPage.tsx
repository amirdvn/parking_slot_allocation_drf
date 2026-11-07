// src/features/parking/pages/GuestRequestPage.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import PageHeader from "../../../components/shared/PageHeader";
import LicensePlateInput from "../../../components/ui/LicensePlateInput";
import { spaceLabel } from "../../../lib/parking-format";

const guestSchema = z.object({
  guest_name: z.string().min(1, "نام مهمان الزامی است"),
  guest_phone: z.string().length(11, "شماره تماس باید ۱۱ رقم باشد"),
  guest_email: z.string().email("ایمیل نامعتبر است"),
  guest_plate_number: z.string().refine(
    (v) => v.replace(/[^0-9۰-۹آ-ی]/g, "").length === 8,
    "پلاک باید به فرمت کامل وارد شود"
  ),
  parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
  reason: z.string().min(1, "دلیل مراجعه الزامی است"),
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

type GuestFormValues = z.infer<typeof guestSchema>;

function GuestRequestPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: spaces } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: () => parkingApi.getSpaces(),
  });

  const guestSpaces = spaces?.filter((s) => s.space_type === "GUEST") || [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: GuestFormValues) => {
      return parkingApi.createGuestRequest({
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("درخواست ثبت شد");
      setSuccessMsg("درخواست شما ثبت شد و پس از تایید مدیر، جایگاه رزرو خواهد شد.");
      setServerError(null);
      reset();
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = "خطا در ثبت";
      if (data) {
        if (data.start_time) msg = data.start_time[0];
        else if (data.end_time) msg = data.end_time[0];
        else if (data.guest_plate_number) msg = data.guest_plate_number[0];
        else if (data.parking_space) msg = data.parking_space[0];
        else if (data.detail) msg = data.detail;
      }
      setServerError(msg);
      toast.error(msg);
      setSuccessMsg(null);
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="درخواست مهمان"
        subtitle="برای مهمان خود جایگاه پارکینگ رزرو کنید"
      />

      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
          <Info size={18} />
        </div>
        <div>
          <p className="text-[13px] font-medium text-gray-900 dark:text-white">
            نیاز به تایید مدیر
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
            پس از ثبت، درخواست برای بررسی ارسال می‌شود.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">
              ثبت شد!
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
              {successMsg}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-gray-900 dark:text-white">
              اطلاعات مهمان
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="نام"
                error={errors.guest_name?.message}
                {...register("guest_name")}
              />
              <Input
                label="شماره تماس"
                dir="ltr"
                error={errors.guest_phone?.message}
                {...register("guest_phone")}
              />
              <Input
                label="ایمیل"
                dir="ltr"
                type="email"
                error={errors.guest_email?.message}
                {...register("guest_email")}
              />

              <Controller
                name="guest_plate_number"
                control={control}
                render={({ field, fieldState }) => (
                  <LicensePlateInput
                    label="پلاک مهمان"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-[#38383a]" />

          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-gray-900 dark:text-white">
              زمان و جایگاه
            </h3>

            {guestSpaces.length === 0 && (
              <div className="mb-3 rounded-xl bg-amber-50 p-3 text-[13px] text-[#ff9500] dark:bg-[#ff9f0a]/10 dark:text-[#ff9f0a]">
                ⚠️ جایگاه مهمان فعالی وجود ندارد.
              </div>
            )}

            <div className="space-y-3">
              <Select
                label="جایگاه"
                options={guestSpaces.map((s) => ({ value: s.id, label: spaceLabel(s) }))}
                error={errors.parking_space?.message}
                {...register("parking_space")}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  type="datetime-local"
                  label="شروع"
                  error={errors.start_time?.message}
                  {...register("start_time")}
                />
                <Input
                  type="datetime-local"
                  label="پایان"
                  error={errors.end_time?.message}
                  {...register("end_time")}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-[#38383a]" />

          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-gray-900 dark:text-white">
              دلیل
            </h3>
            <div className="space-y-3">
              <Input
                label="دلیل"
                placeholder="جلسه کاری..."
                error={errors.reason?.message}
                {...register("reason")}
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#007aff] dark:bg-[#1c1c1e] dark:text-white dark:focus:bg-[#2c2c2e] dark:focus:ring-[#0a84ff]"
                  {...register("description")}
                />
              </div>
            </div>
          </div>

          {serverError && (
            <div className="rounded-xl bg-red-50 p-3 text-[13px] text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
              {serverError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending || guestSpaces.length === 0}
              className="flex-1"
            >
              <UserPlus size={16} />
              {mutation.isPending ? "..." : "ثبت درخواست"}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              پاک کردن
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GuestRequestPage;