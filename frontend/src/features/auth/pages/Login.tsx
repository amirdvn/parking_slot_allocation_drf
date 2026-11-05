// src/features/auth/pages/Login.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ParkingSquare } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import ThemeToggle from "../../../components/shared/ThemeToggle";

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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormValues) => authApi.sendOtp(data.phone_number),
    onSuccess: (_, variables) => {
      sessionStorage.setItem("pending_phone", variables.phone_number);
      toast.success("کد تایید ارسال شد");
      navigate(`/verify-otp?phone=${encodeURIComponent(variables.phone_number)}`);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <ThemeToggle />

      <div className="w-full max-w-[360px] animate-fade-in">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007aff] shadow-lg shadow-[#007aff]/20 dark:bg-[#0a84ff]">
            <ParkingSquare size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white">
            پارکینگ هوشمند
          </h1>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
            سیستم مدیریت پارکینگ
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-[20px] font-semibold text-gray-900 dark:text-white">
              ورود به سیستم
            </h2>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
              شماره موبایل خود را وارد کنید
            </p>
          </div>

          <form
            onSubmit={handleSubmit((d) => { setServerError(null); mutation.mutate(d); })}
            className="space-y-4"
          >
            <Input
              label="شماره موبایل"
              placeholder="09123456789"
              dir="ltr"
              type="tel"
              error={errors.phone_number?.message}
              {...register("phone_number")}
            />

            {serverError && (
              <div className="rounded-xl bg-red-50 p-3 text-[13px] text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-full py-3">
              {mutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-400 dark:text-gray-600">
          با ورود، قوانین سیستم را می‌پذیرید
        </p>
      </div>
    </div>
  );
}

export default Login;