import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus } from "lucide-react";
import { parkingApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const guestSchema = z.object({
  guest_name: z.string().min(1, "نام مهمان الزامی است"),
  guest_phone: z.string().length(11, "شماره تماس باید ۱۱ رقم باشد"),
  guest_email: z.string().email("ایمیل نامعتبر است"),
  guest_plate_number: z.string().min(1, "پلاک خودرو الزامی است"),
  parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
  start_time: z.string().min(1, "زمان شروع الزامی است"),
  end_time: z.string().min(1, "زمان پایان الزامی است"),
  reason: z.string().min(1, "دلیل مراجعه الزامی است"),
  description: z.string().optional(),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: "زمان پایان باید بعد از زمان شروع باشد",
  path: ["end_time"],
});
type GuestFormValues = z.infer<typeof guestSchema>;

function GuestRequestPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // فقط جایگاه‌های نوع GUEST باید نمایش داده شوند
  const { data: spaces } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: parkingApi.getSpaces,
  });

  const guestSpaces = spaces?.filter(s => s.space_type === "GUEST") || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: GuestFormValues) => {
      const payload = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };
      return parkingApi.createGuestRequest(payload);
    },
    onSuccess: () => {
      setSuccessMsg("درخواست مهمان با موفقیت ثبت شد و در انتظار تایید مدیر است.");
      setServerError(null);
      reset();
    },
    onError: (error: any) => {
      const err = error.response?.data;
      setServerError(err?.parking_space?.[0] || err?.detail || "خطا در ثبت درخواست");
      setSuccessMsg(null);
    },
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <UserPlus className="text-primary-600" />
        <h1 className="text-xl font-bold text-secondary-900">ثبت درخواست مهمان</h1>
      </div>
      <p className="text-sm text-text-secondary">
        شما می‌توانید برای مهمانان خود درخواست جایگاه پارکینگ ثبت کنید.
      </p>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="نام و نام خانوادگی مهمان" error={errors.guest_name?.message} {...register("guest_name")} />
            <Input label="شماره تماس مهمان" dir="ltr" placeholder="09123456789" error={errors.guest_phone?.message} {...register("guest_phone")} />
            <Input label="ایمیل مهمان" dir="ltr" type="email" error={errors.guest_email?.message} {...register("guest_email")} />
            <Input label="شماره پلاک خودرو" dir="ltr" error={errors.guest_plate_number?.message} {...register("guest_plate_number")} />
          </div>

          <Select
            label="انتخاب جایگاه مهمان"
            options={guestSpaces.map(s => ({ value: s.id, label: `${s.code} (${s.floor})` }))}
            error={errors.parking_space?.message}
            {...register("parking_space")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="datetime-local" label="زمان شروع" error={errors.start_time?.message} {...register("start_time")} />
            <Input type="datetime-local" label="زمان پایان" error={errors.end_time?.message} {...register("end_time")} />
          </div>

          <Input label="دلیل مراجعه" placeholder="مثلا: جلسه کاری" error={errors.reason?.message} {...register("reason")} />
          <Input label="توضیحات (اختیاری)" {...register("description")} />

          {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{serverError}</div>}
          {successMsg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{successMsg}</div>}

          <Button type="submit" disabled={mutation.isPending} className="mt-2 w-full">
            {mutation.isPending ? "در حال ثبت..." : "ثبت درخواست مهمان"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default GuestRequestPage;