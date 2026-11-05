import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ParkingSquare,
  UserPlus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

const registerSchema = z.object({
  full_name: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  email: z.string().email("فرمت ایمیل صحیح نیست"),
  department: z.enum(["MANAGEMENT", "ADMINISTRATIVE", "WORKERS"], {
    message: "دپارتمان را انتخاب کنید",
  }),
  role: z.enum(["USER", "GUARD", "MANAGER"], { message: "نقش را انتخاب کنید" }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

const departmentOptions = [
  { value: "MANAGEMENT", label: "مدیریت" },
  { value: "ADMINISTRATIVE", label: "اداری" },
  { value: "WORKERS", label: "کارگران" },
];

const roleOptions = [
  { value: "USER", label: "کاربر عادی" },
  { value: "GUARD", label: "نگهبان" },
  { value: "MANAGER", label: "مدیر" },
];

function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const phoneNumber = urlParams.get("phone") || sessionStorage.getItem("pending_phone");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      authApi.register({ ...data, phone_number: phoneNumber || "" }),
    onSuccess: () => {
      sessionStorage.removeItem("pending_phone");
      toast.success("ثبت‌نام با موفقیت انجام شد. لطفاً وارد شوید.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  // اگر شماره نیست - صفحه خطای زیبا
  if (!phoneNumber) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-secondary-900">شماره موبایل یافت نشد</h1>
          <p className="mt-2 text-sm text-text-secondary">
            برای ثبت‌نام ابتدا باید شماره موبایل خود را در صفحه ورود تایید کنید.
          </p>
          <Button onClick={() => navigate("/login")} className="mt-6 w-full">
            بازگشت به صفحه ورود
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen">
      {/* ستون فرم (راست) */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* لوگو در موبایل */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-3 shadow-lg">
              <ParkingSquare size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">پارکینگ هوشمند</h1>
              <p className="text-xs text-text-secondary">سیستم مدیریت پارکینگ</p>
            </div>
          </div>

          {/* دکمه بازگشت */}
          <button
            onClick={() => navigate("/login")}
            className="mb-4 flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-primary-600"
          >
            <ArrowRight size={14} />
            بازگشت به ورود
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-secondary-900">تکمیل ثبت‌نام</h2>
            <p className="mt-2 text-sm text-text-secondary">
              شماره موبایل{" "}
              <span className="font-bold text-primary-600" dir="ltr">
                {phoneNumber}
              </span>{" "}
              تایید شد. اطلاعات خود را تکمیل کنید.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="نام و نام خانوادگی"
              placeholder="مثلا: امیر داوری"
              error={errors.full_name?.message}
              {...register("full_name")}
            />
            <Input
              label="ایمیل"
              type="email"
              dir="ltr"
              placeholder="example@company.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Select
              label="دپارتمان"
              options={departmentOptions}
              error={errors.department?.message}
              {...register("department")}
            />
            <Select
              label="نقش"
              options={roleOptions}
              error={errors.role?.message}
              {...register("role")}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20 dark:text-red-400">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="mt-2 w-full bg-gradient-to-l from-primary-600 to-primary-500 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30"
            >
              {mutation.isPending ? "در حال ثبت‌نام..." : "تکمیل ثبت‌نام"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-text-secondary">
            با ثبت‌نام، قوانین و مقررات سیستم را می‌پذیرید.
          </p>
        </div>
      </div>

      {/* ستون تصویری (چپ) - فقط دسکتاپ */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-primary-900 lg:block">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          <div className="mb-8 rounded-3xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
            <UserPlus size={64} className="text-white" />
          </div>

          <h2 className="mb-4 text-center text-4xl font-bold leading-tight">
            به ما بپیوندید
          </h2>
          <p className="mb-12 max-w-md text-center text-lg text-white/80">
            در چند ثانیه ثبت‌نام کنید و از سیستم هوشمند پارکینگ بهره‌مند شوید
          </p>

          <div className="grid w-full max-w-md grid-cols-1 gap-4">
            <FeatureCard
              icon={<Sparkles size={22} />}
              title="راه‌اندازی سریع"
              description="فقط با شماره موبایل، بدون نیاز به رمز عبور"
            />
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              title="امنیت تضمینی"
              description="احراز هویت با رمز یکبار مصرف"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white/20 p-2 text-white">{icon}</div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/70">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default Register;