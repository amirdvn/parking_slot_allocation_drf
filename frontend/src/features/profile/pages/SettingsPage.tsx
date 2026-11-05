import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { User, Phone, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "../api";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const profileSchema = z.object({
  full_name: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  description: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const changePhoneSchema = z.object({
  phone_number: z
    .string()
    .length(11, "شماره موبایل باید ۱۱ رقم باشد")
    .regex(/^09[0-9]{9}$/, "فرمت شماره موبایل صحیح نیست"),
});
type ChangePhoneFormValues = z.infer<typeof changePhoneSchema>;

const otpSchema = z.object({
  code: z.string().length(4, "کد تایید باید ۴ رقم باشد"),
});
type OtpFormValues = z.infer<typeof otpSchema>;

const roleTranslations: Record<string, string> = {
  USER: "کاربر عادی",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};

const deptTranslations: Record<string, string> = {
  MANAGEMENT: "مدیریت",
  ADMINISTRATIVE: "اداری",
  WORKERS: "کارگران",
};

function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "phone">("profile");

  // ===== بخش پروفایل =====
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      description: user?.description || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: async () => {
      await refreshUser();
      toast.success("پروفایل با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا در به‌روزرسانی پروفایل");
    },
  });

  // ===== بخش تغییر شماره =====
  const [otpSent, setOtpSent] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  const phoneForm = useForm<ChangePhoneFormValues>({
    resolver: zodResolver(changePhoneSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const sendOtpMutation = useMutation({
    mutationFn: (data: ChangePhoneFormValues) => profileApi.sendChangePhoneOtp(data.phone_number),
    onSuccess: (_, variables) => {
      setPendingPhone(variables.phone_number);
      setOtpSent(true);
      toast.success("کد تایید به شماره جدید ارسال شد");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "خطا در ارسال کد تایید");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: OtpFormValues) =>
      profileApi.verifyChangePhoneOtp({ phone_number: pendingPhone, code: Number(data.code) }),
    onSuccess: async () => {
      await refreshUser();
      toast.success("شماره موبایل با موفقیت تغییر کرد");
      setOtpSent(false);
      setPendingPhone("");
      phoneForm.reset();
      otpForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "کد وارد شده صحیح نیست");
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-secondary-900">تنظیمات حساب</h1>

      {/* اطلاعات پایه (غیرقابل ویرایش) */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-primary-600" />
          <h2 className="font-bold text-secondary-900">اطلاعات حساب</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary text-xs mb-1">ایمیل</p>
            <p className="font-medium text-secondary-900" dir="ltr">{user?.email}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs mb-1">نقش</p>
            <p className="font-medium text-secondary-900">
              {user ? roleTranslations[user.role] : "-"}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-xs mb-1">دپارتمان</p>
            <p className="font-medium text-secondary-900">
              {user ? deptTranslations[user.department] : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSection("profile")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeSection === "profile"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <User size={16} /> ویرایش پروفایل
        </button>
        <button
          onClick={() => setActiveSection("phone")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeSection === "phone"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <Phone size={16} /> تغییر شماره موبایل
        </button>
      </div>

      {/* بخش پروفایل */}
      {activeSection === "profile" && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form
            onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <Input
              label="نام و نام خانوادگی"
              placeholder="مثلا: امیر داوری"
              error={profileForm.formState.errors.full_name?.message}
              {...profileForm.register("full_name")}
            />
            <Input
              label="توضیحات (اختیاری)"
              placeholder="توضیح کوتاه درباره خودتان..."
              error={profileForm.formState.errors.description?.message}
              {...profileForm.register("description")}
            />
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="gap-2"
              >
                <Save size={16} />
                {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* بخش تغییر شماره */}
      {activeSection === "phone" && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            شماره فعلی شما: <span className="font-bold" dir="ltr">{user?.phone_number}</span>
          </div>

          {!otpSent ? (
            <form
              onSubmit={phoneForm.handleSubmit((data) => sendOtpMutation.mutate(data))}
              className="flex flex-col gap-4"
            >
              <Input
                label="شماره موبایل جدید"
                placeholder="09123456789"
                dir="ltr"
                error={phoneForm.formState.errors.phone_number?.message}
                {...phoneForm.register("phone_number")}
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={sendOtpMutation.isPending} className="gap-2">
                  <Phone size={16} />
                  {sendOtpMutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={otpForm.handleSubmit((data) => verifyOtpMutation.mutate(data))}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-text-secondary">
                کد ۴ رقمی ارسال شده به{" "}
                <span className="font-bold text-secondary-900" dir="ltr">{pendingPhone}</span> را وارد کنید.
              </p>
              <Input
                label="کد تایید"
                placeholder="----"
                dir="ltr"
                className="text-center text-2xl tracking-widest"
                maxLength={4}
                error={otpForm.formState.errors.code?.message}
                {...otpForm.register("code")}
              />
              <div className="flex gap-3 mt-2">
                <Button
                  type="submit"
                  disabled={verifyOtpMutation.isPending}
                  className="flex-1"
                >
                  {verifyOtpMutation.isPending ? "در حال بررسی..." : "تایید و تغییر شماره"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOtpSent(false);
                    setPendingPhone("");
                    otpForm.reset();
                  }}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;