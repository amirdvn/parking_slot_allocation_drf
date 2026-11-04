import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api";
import { useAuth } from "../AuthContext";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const otpSchema = z.object({
  code: z.string().length(4, "کد تایید باید ۴ رقم باشد"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const phoneNumber = location.state?.phone_number;

  // اگر کاربر مستقیم اومده باشه به این صفحه بدون شماره موبایل
  if (!phoneNumber) {
    return <Navigate to="/login" replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: OtpFormValues) => authApi.verifyOtp(phoneNumber, data.code),
    onSuccess: async (response) => {
      if (response.is_registered && response.tokens) {
        await login(response.tokens);
        navigate("/");
      } else {
        // اگر کاربر جدید بود، باید اطلاعات تکمیلی رو پر کنه
        navigate("/register", { state: { phone_number: phoneNumber } });
      }
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.error || "کد وارد شده صحیح نیست.");
    },
  });

  const onSubmit = (data: OtpFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900">تایید شماره موبایل</h1>
          <p className="mt-2 text-sm text-text-secondary">
            کد ۴ رقمی ارسال شده به <span className="font-bold text-secondary-900" dir="ltr">{phoneNumber}</span> را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            label="کد تایید"
            placeholder="----"
            dir="ltr"
            className="text-center text-2xl tracking-widest"
            maxLength={4}
            error={errors.code?.message}
            {...register("code")}
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "در حال بررسی..." : "تایید و ورود"}
          </Button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-2 text-sm text-text-secondary hover:text-secondary-900"
          >
            ویرایش شماره موبایل
          </button>
        </form>
      </div>
    </div>
  );
}

export default VerifyOtp;