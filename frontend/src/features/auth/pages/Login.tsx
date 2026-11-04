import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900">ورود به سیستم</h1>
          <p className="mt-2 text-sm text-text-secondary">
            برای ورود، شماره موبایل خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            label="شماره موبایل"
            placeholder="09123456789"
            dir="ltr"
            error={errors.phone_number?.message}
            {...register("phone_number")}
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;