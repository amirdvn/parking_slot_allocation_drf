import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UserPlus,
  CalendarClock,
  CheckCircle2,
  Info,
  Sparkles,
  Mail,
  Phone,
  Car,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { parkingApi } from "../api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const guestSchema = z
  .object({
    guest_name: z.string().min(1, "نام مهمان الزامی است"),
    guest_phone: z.string().length(11, "شماره تماس باید ۱۱ رقم باشد"),
    guest_email: z.string().email("ایمیل نامعتبر است"),
    guest_plate_number: z.string().min(1, "پلاک خودرو الزامی است"),
    parking_space: z.string().min(1, "انتخاب جایگاه الزامی است"),
    start_time: z.string().min(1, "زمان شروع الزامی است"),
    end_time: z.string().min(1, "زمان پایان الزامی است"),
    reason: z.string().min(1, "دلیل مراجعه الزامی است"),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "زمان پایان باید بعد از زمان شروع باشد",
    path: ["end_time"],
  });
type GuestFormValues = z.infer<typeof guestSchema>;

function GuestRequestPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: spaces } = useQuery({
    queryKey: ["parking-spaces"],
    queryFn: parkingApi.getSpaces,
  });

  const guestSpaces = spaces?.filter((s) => s.space_type === "GUEST") || [];

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
      toast.success("درخواست مهمان با موفقیت ثبت شد");
      setSuccessMsg(
        "درخواست شما ثبت شد و پس از تایید مدیر، جایگاه برای مهمان شما رزرو خواهد شد."
      );
      setServerError(null);
      reset();
    },
    onError: (error: any) => {
      const err = error.response?.data;
      const msg = err?.parking_space?.[0] || err?.detail || "خطا در ثبت درخواست";
      setServerError(msg);
      toast.error(msg);
      setSuccessMsg(null);
    },
  });

  const onSubmit = (data: GuestFormValues) => mutation.mutate(data);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-purple-600 via-indigo-700 to-primary-800 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus size={20} className="text-white/80" />
              <p className="text-sm text-white/80">درخواست مهمان</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              پارکینگ برای مهمان
            </h1>
            <p className="mt-2 text-sm text-white/70">
              برای مهمانان خود جایگاه پارکینگ رزرو کنید
            </p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 sm:block">
            <Sparkles size={32} />
          </div>
        </div>
      </div>

      {/* 👇 Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-50 to-white p-4 dark:border-blue-800/50 dark:from-blue-900/20 dark:to-surface">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <Info size={18} />
        </div>
        <div className="text-sm">
          <p className="font-bold text-blue-900 dark:text-blue-300">
            درخواست شما نیاز به تایید مدیر دارد
          </p>
          <p className="mt-1 text-blue-700 dark:text-blue-400/80">
            پس از ثبت، درخواست برای بررسی به مدیر ارسال می‌شود و نتیجه از طریق اعلان‌ها به شما اطلاع داده خواهد شد.
          </p>
        </div>
      </div>

      {/* 👇 Success / Error */}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-4 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-surface">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-sm">
            <p className="font-bold text-emerald-900 dark:text-emerald-300">ثبت شد!</p>
            <p className="mt-1 text-emerald-700 dark:text-emerald-400/80">{successMsg}</p>
          </div>
        </div>
      )}

      {/* 👇 Form */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: اطلاعات مهمان */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <UserPlus size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-bold text-secondary-900">اطلاعات مهمان</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="نام و نام خانوادگی مهمان"
                placeholder="مثلا: علی رضایی"
                error={errors.guest_name?.message}
                {...register("guest_name")}
              />
              <Input
                label="شماره تماس"
                dir="ltr"
                placeholder="09123456789"
                error={errors.guest_phone?.message}
                {...register("guest_phone")}
              />
              <Input
                label="ایمیل"
                dir="ltr"
                type="email"
                placeholder="guest@example.com"
                error={errors.guest_email?.message}
                {...register("guest_email")}
              />
              <Input
                label="شماره پلاک خودرو"
                dir="ltr"
                placeholder="1234ب123"
                error={errors.guest_plate_number?.message}
                {...register("guest_plate_number")}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Section 2: اطلاعات پارکینگ */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <CalendarClock size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-secondary-900">زمان و جایگاه</h2>
            </div>

            {guestSpaces.length === 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                ⚠️ در حال حاضر هیچ جایگاه مهمانی فعالی وجود ندارد. لطفاً با مدیر سیستم تماس بگیرید.
              </div>
            )}

            <div className="space-y-4">
              <Select
                label="انتخاب جایگاه مهمان"
                options={guestSpaces.map((s) => ({
                  value: s.id,
                  label: `${s.code} (${s.floor})`,
                }))}
                error={errors.parking_space?.message}
                {...register("parking_space")}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Section 3: دلیل */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-bold text-secondary-900">دلیل مراجعه</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="دلیل مراجعه"
                placeholder="مثلا: جلسه کاری، ملاقات، ..."
                error={errors.reason?.message}
                {...register("reason")}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  placeholder="اگر توضیح بیشتری دارید، اینجا بنویسید..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  {...register("description")}
                />
              </div>
            </div>
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending || guestSpaces.length === 0}
              className="flex-1 bg-gradient-to-l from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
            >
              <UserPlus size={18} />
              {mutation.isPending ? "در حال ثبت..." : "ثبت درخواست مهمان"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={mutation.isPending}
            >
              پاک کردن
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GuestRequestPage;