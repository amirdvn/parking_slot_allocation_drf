// src/features/auth/pages/VerifyOtp.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api";
import { useAuth } from "../AuthContext";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import ThemeToggle from "../../../components/shared/ThemeToggle";

const otpSchema = z.object({
  code: z.string().length(4, "کد تایید باید ۴ رقم باشد"),
});
type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const phoneNumber = searchParams.get("phone") || sessionStorage.getItem("pending_phone");

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const { register, handleSubmit, formState: { errors } } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: OtpFormValues) => authApi.verifyOtp(phoneNumber!, data.code),
    onSuccess: async (response) => {
      if (response?.is_registered && response?.tokens) {
        await login(response.tokens);
        sessionStorage.removeItem("pending_phone");
        window.location.href = "/";
      } else {
        window.location.href = `/register?phone=${encodeURIComponent(phoneNumber || "")}`;
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || "کد وارد شده صحیح نیست";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.sendOtp(phoneNumber!),
    onSuccess: () => {
      setCountdown(120);
      setCanResend(false);
      toast.success("کد مجدداً ارسال شد");
    },
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!phoneNumber) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
        <ThemeToggle />
        <div className="w-full max-w-[360px] rounded-2xl bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
            <KeyRound size={28} />
          </div>
          <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">خطا</h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
            لطفاً از ابتدا وارد شوید
          </p>
          <Button onClick={() => navigate("/login")} className="mt-5 w-full">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <ThemeToggle />

      <div className="w-full max-w-[360px] animate-fade-in">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007aff] shadow-lg shadow-[#007aff]/20 dark:bg-[#0a84ff]">
            <KeyRound size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white">تایید هویت</h1>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
            کد ۴ رقمی را وارد کنید
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <button
            onClick={() => navigate("/login")}
            className="mb-4 flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
          >
            <ArrowRight size={12} />
            تغییر شماره
          </button>

          <p className="mb-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
            کد ارسال شده به{" "}
            <span className="font-semibold text-gray-900 dark:text-white" dir="ltr">
              {phoneNumber}
            </span>
          </p>

          <form
            onSubmit={handleSubmit((d) => { setServerError(null); mutation.mutate(d); })}
            className="space-y-4"
          >
            <Input
              label="کد تایید"
              placeholder="----"
              dir="ltr"
              className="text-center text-[20px] tracking-[0.6em] font-semibold"
              maxLength={4}
              error={errors.code?.message}
              {...register("code")}
            />

            {serverError && (
              <div className="rounded-xl bg-red-50 p-3 text-[13px] text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-full py-3">
              {mutation.isPending ? "در حال بررسی..." : "تایید و ورود"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            {canResend ? (
              <button
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                <RotateCcw size={13} />
                ارسال مجدد کد
              </button>
            ) : (
              <p className="text-[12px] text-gray-500 dark:text-gray-500">
                ارسال مجدد در{" "}
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {formatTime(countdown)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;