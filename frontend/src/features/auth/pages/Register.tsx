// src/features/auth/pages/Register.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UserPlus, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

const registerSchema = z.object({
  full_name: z.string().min(3, "نام حداقل ۳ کاراکتر"),
  email: z.string().email("ایمیل صحیح نیست"),
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
  const [isSuccess, setIsSuccess] = useState(false);

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
      setIsSuccess(true);
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || "خطا در ثبت‌نام";
      setServerError(msg);
      toast.error(msg);
    },
  });

  if (!phoneNumber) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[360px] rounded-2xl bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
            <UserPlus size={28} />
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

  if (isSuccess) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[360px] animate-scale-in rounded-2xl bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-[20px] font-semibold text-gray-900 dark:text-white">
            ثبت‌نام موفق
          </h1>
          <p className="mt-2 text-[13px] text-gray-500 dark:text-gray-400">
            در حال انتقال...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007aff] shadow-lg shadow-[#007aff]/20 dark:bg-[#0a84ff]">
            <UserPlus size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white">تکمیل ثبت‌نام</h1>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
            اطلاعات خود را وارد کنید
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <button
            onClick={() => navigate("/login")}
            className="mb-4 flex items-center gap-1 text-[12px] text-[#007aff] hover:underline dark:text-[#0a84ff]"
          >
            <ArrowRight size={12} />
            بازگشت
          </button>

          <form onSubmit={handleSubmit((d) => { setServerError(null); mutation.mutate(d); })} className="space-y-4">
            <Input
              label="نام و نام خانوادگی"
              placeholder="امیر داوری"
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
            <Select label="دپارتمان" options={departmentOptions} error={errors.department?.message} {...register("department")} />
            <Select label="نقش" options={roleOptions} error={errors.role?.message} {...register("role")} />

            {serverError && (
              <div className="rounded-xl bg-red-50 p-3 text-[13px] text-[#ff3b30] dark:bg-[#ff453a]/10 dark:text-[#ff453a]">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-full py-3">
              {mutation.isPending ? "در حال ثبت..." : "تکمیل ثبت‌نام"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;