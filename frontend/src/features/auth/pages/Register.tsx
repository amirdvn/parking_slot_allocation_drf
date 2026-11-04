// src/features/auth/pages/Register.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

const registerSchema = z.object({
  full_name: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  email: z.string().email("فرمت ایمیل صحیح نیست"),
  department: z.enum(["MANAGEMENT", "ADMINISTRATIVE", "WORKERS"], { message: "دپارتمان را انتخاب کنید" }),
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

  // 🚀 خواندن شماره از URL به صورت مستقیم (بدون React Router hooks)
  const urlParams = new URLSearchParams(window.location.search);
  const phoneNumber = urlParams.get("phone") || sessionStorage.getItem("pending_phone");

  console.log("=== REGISTER DEBUG ===");
  console.log("Full URL:", window.location.href);
  console.log("URL phone:", urlParams.get("phone"));
  console.log("Storage phone:", sessionStorage.getItem("pending_phone"));
  console.log("Final phone:", phoneNumber);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      authApi.register({ ...data, phone_number: phoneNumber || "" }),
    onSuccess: () => {
      sessionStorage.removeItem("pending_phone");
      alert("ثبت‌نام با موفقیت انجام شد. لطفاً وارد شوید.");
      window.location.href = "/login";
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.error || "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.");
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  // ❌ حذف کامل ریدایرکت! فقط یک هشدار نشون بده
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900">تکمیل ثبت‌نام</h1>
          {phoneNumber ? (
            <p className="mt-2 text-sm text-text-secondary">
              شماره موبایل <span className="font-bold text-secondary-900" dir="ltr">{phoneNumber}</span> تایید شد.
            </p>
          ) : (
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ شماره موبایل یافت نشد. لطفاً ابتدا از طریق صفحه ورود، شماره خود را تایید کنید.
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 block text-primary-600 underline"
              >
                رفتن به صفحه ورود
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input label="نام و نام خانوادگی" placeholder="مثلا: امیر داوری" error={errors.full_name?.message} {...register("full_name")} />
          <Input label="ایمیل" type="email" dir="ltr" placeholder="example@company.com" error={errors.email?.message} {...register("email")} />
          <Select label="دپارتمان" options={departmentOptions} error={errors.department?.message} {...register("department")} />
          <Select label="نقش" options={roleOptions} error={errors.role?.message} {...register("role")} />

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-danger">{serverError}</div>
          )}

          <Button type="submit" disabled={mutation.isPending || !phoneNumber} className="mt-2 w-full">
            {mutation.isPending ? "در حال ثبت‌نام..." : "تکمیل ثبت‌نام"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Register;