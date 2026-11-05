// src/features/auth/pages/Login.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ParkingSquare, Shield, Zap } from "lucide-react";
import { authApi } from "../api";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const loginSchema = z.object({
  phone_number: z
    .string()
    .length(11, "شماره موبایل باید ۱۱ رقم باشد")
    .regex(/^09[0-9]{9}$/, "فرمت شماره موبایل صحیح نیست"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormValues) => authApi.sendOtp(data.phone_number),
    onSuccess: (_, variables) => {
      sessionStorage.setItem("pending_phone", variables.phone_number);
      navigate(`/verify-otp?phone=${encodeURIComponent(variables.phone_number)}`);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.error || "خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

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

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">خوش آمدید 👋</h2>
            <p className="mt-2 text-sm text-text-secondary">
              برای ورود به پنل، شماره موبایل خود را وارد کنید
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="شماره موبایل"
              placeholder="09123456789"
              dir="ltr"
              error={errors.phone_number?.message}
              {...register("phone_number")}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20 dark:text-red-400">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-l from-primary-600 to-primary-500 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30"
            >
              {mutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-text-secondary">
            با ورود به سیستم، قوانین و مقررات را می‌پذیرید.
          </p>
        </div>
      </div>

      {/* ستون تصویری (چپ) - فقط دسکتاپ */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 lg:block">
        {/* الگوی نقطه‌ای */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* شکل‌های تزئینی */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

        {/* محتوا */}
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          <div className="mb-8 rounded-3xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
            <ParkingSquare size={64} className="text-white" />
          </div>

          <h2 className="mb-4 text-center text-4xl font-bold leading-tight">
            پارکینگ هوشمند
          </h2>
          <p className="mb-12 max-w-md text-center text-lg text-white/80">
            مدیریت ساده، سریع و هوشمند فضای پارکینگ سازمان شما
          </p>

          <div className="grid w-full max-w-md grid-cols-1 gap-4">
            <FeatureCard
              icon={<Zap size={22} />}
              title="تخصیص هوشمند جایگاه"
              description="اختصاص خودکار جایگاه بر اساس نوع خودرو"
            />
            <FeatureCard
              icon={<Shield size={22} />}
              title="امنیت بالا"
              description="احراز هویت دو مرحله‌ای با رمز یکبار مصرف"
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

export default Login;