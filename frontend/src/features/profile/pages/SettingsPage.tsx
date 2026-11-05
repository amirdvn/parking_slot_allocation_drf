// src/features/profile/pages/SettingsPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  User, Phone, Mail, Building2, BadgeCheck, KeyRound, ArrowRight,
  CheckCircle2, AtSign,
} from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "../api";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const profileSchema = z.object({
  full_name: z.string().min(3, "نام حداقل ۳ کاراکتر"),
  description: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const phoneSchema = z.object({
  phone_number: z
    .string()
    .length(11, "شماره موبایل باید ۱۱ رقم باشد")
    .regex(/^09[0-9]{9}$/, "فرمت صحیح نیست"),
});
type PhoneFormValues = z.infer<typeof phoneSchema>;

const otpSchema = z.object({
  code: z.string().length(4, "کد باید ۴ رقم باشد"),
});
type OtpFormValues = z.infer<typeof otpSchema>;

const roleLabels: Record<string, string> = {
  USER: "کاربر",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};

const deptLabels: Record<string, string> = {
  MANAGEMENT: "مدیریت",
  ADMINISTRATIVE: "اداری",
  WORKERS: "کارگران",
};

type Section = "profile" | "phone" | "account";

const sidebarItems: { key: Section; icon: React.ReactNode; title: string }[] = [
  { key: "profile", icon: <User size={18} />, title: "ویرایش پروفایل" },
  { key: "phone", icon: <Phone size={18} />, title: "تغییر شماره" },
  { key: "account", icon: <BadgeCheck size={18} />, title: "اطلاعات حساب" },
];

function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("profile");

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
      toast.success("پروفایل به‌روزرسانی شد");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "خطا"),
  });

  const [otpSent, setOtpSent] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const sendOtpMutation = useMutation({
    mutationFn: (d: PhoneFormValues) => profileApi.sendChangePhoneOtp(d.phone_number),
    onSuccess: (_, v) => {
      setPendingPhone(v.phone_number);
      setOtpSent(true);
      toast.success("کد تایید ارسال شد");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "خطا"),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (d: OtpFormValues) =>
      profileApi.verifyChangePhoneOtp({
        phone_number: pendingPhone,
        code: Number(d.code),
      }),
    onSuccess: async () => {
      await refreshUser();
      toast.success("شماره تغییر کرد");
      setOtpSent(false);
      setPendingPhone("");
      phoneForm.reset();
      otpForm.reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "کد صحیح نیست"),
  });

  const avatarLetter = user?.full_name?.charAt(0) || "?";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          تنظیمات حساب
        </h2>
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
          اطلاعات شخصی و امنیتی خود را مدیریت کنید
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#007aff] text-[28px] font-bold text-white shadow-md shadow-[#007aff]/20 dark:bg-[#0a84ff]">
            {avatarLetter}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">
              {user?.full_name}
            </h3>
            <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400" dir="ltr">
              {user?.phone_number}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
                {roleLabels[user?.role || "USER"]}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300">
                {deptLabels[user?.department || "WORKERS"]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-[13px] transition-colors ${
                  isActive
                    ? "bg-[#007aff]/8 text-[#007aff] dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2c2c2e]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[#007aff]/12 shadow-md shadow-[#007aff]/25 dark:bg-[#0a84ff]/15 dark:shadow-[#0a84ff]/20"
                      : "bg-transparent"
                  }`}
                >
                  <span
                    className={`transition-all duration-300 ${
                      isActive
                        ? "animate-icon-pop text-[#007aff] drop-shadow-[0_2px_4px_rgba(0,122,255,0.4)] dark:text-[#0a84ff]"
                        : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                </span>
                <span className={`transition-all ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative h-fit">
          <div className="relative h-fit rounded-2xl border border-border bg-surface p-6 shadow-sm">
            {activeSection === "profile" && (
              <div className="animate-page-enter">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    اطلاعات شخصی
                  </h3>
                  <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                    نام و توضیحات خود را ویرایش کنید
                  </p>
                </div>

                <form
                  onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))}
                  className="space-y-4"
                >
                  <Input
                    label="نام و نام خانوادگی"
                    error={profileForm.formState.errors.full_name?.message}
                    {...profileForm.register("full_name")}
                  />

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      ایمیل
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[15px] text-gray-500 dark:border-[#38383a] dark:bg-[#2c2c2e] dark:text-gray-400">
                      <AtSign size={16} />
                      <span dir="ltr">{user?.email}</span>
                      <span className="mr-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-[#3a3a3c] dark:text-gray-400">
                        غیرقابل تغییر
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      توضیحات (اختیاری)
                    </label>
                    <textarea
                      placeholder="توضیح کوتاه درباره خودتان..."
                      rows={3}
                      className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#007aff] dark:bg-[#1c1c1e] dark:text-white dark:focus:bg-[#2c2c2e] dark:focus:ring-[#0a84ff]"
                      {...profileForm.register("description")}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "phone" && (
              <div className="animate-page-enter">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    تغییر شماره موبایل
                  </h3>
                  <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                    شماره جدید را وارد و تایید کنید
                  </p>
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-[#38383a] dark:bg-[#2c2c2e]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      شماره فعلی
                    </p>
                    <p className="font-mono text-[14px] font-bold text-gray-900 dark:text-white" dir="ltr">
                      {user?.phone_number}
                    </p>
                  </div>
                </div>

                {!otpSent ? (
                  <form
                    onSubmit={phoneForm.handleSubmit((d) => sendOtpMutation.mutate(d))}
                    className="space-y-4"
                  >
                    <Input
                      label="شماره موبایل جدید"
                      placeholder="09xxxxxxxxx"
                      dir="ltr"
                      error={phoneForm.formState.errors.phone_number?.message}
                      {...phoneForm.register("phone_number")}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={sendOtpMutation.isPending}>
                        {sendOtpMutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form
                    onSubmit={otpForm.handleSubmit((d) => verifyOtpMutation.mutate(d))}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[13px] text-[#007aff] dark:border-[#0a84ff]/20 dark:bg-[#0a84ff]/10 dark:text-[#0a84ff]">
                      <p className="flex items-start gap-2">
                        <KeyRound size={16} className="mt-0.5 shrink-0" />
                        <span>
                          کد ۴ رقمی ارسال شده به{" "}
                          <span className="font-bold" dir="ltr">{pendingPhone}</span> را وارد کنید.
                        </span>
                      </p>
                    </div>

                    <Input
                      label="کد تایید"
                      placeholder="----"
                      dir="ltr"
                      className="text-center text-[20px] font-bold tracking-[0.5em]"
                      maxLength={4}
                      error={otpForm.formState.errors.code?.message}
                      {...otpForm.register("code")}
                    />

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOtpSent(false);
                          setPendingPhone("");
                          otpForm.reset();
                        }}
                      >
                        <ArrowRight size={16} />
                        انصراف
                      </Button>
                      <Button type="submit" disabled={verifyOtpMutation.isPending}>
                        {verifyOtpMutation.isPending ? "در حال تایید..." : "تایید"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeSection === "account" && (
              <div className="animate-page-enter">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    اطلاعات حساب
                  </h3>
                  <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                    این اطلاعات توسط مدیر سیستم تعیین شده
                  </p>
                </div>

                <div className="space-y-2">
                  <InfoRow
                    icon={<Mail size={16} />}
                    label="ایمیل"
                    value={user?.email || "---"}
                    dir="ltr"
                  />
                  <InfoRow
                    icon={<Phone size={16} />}
                    label="شماره موبایل"
                    value={user?.phone_number || "---"}
                    dir="ltr"
                  />
                  <InfoRow
                    icon={<Building2 size={16} />}
                    label="دپارتمان"
                    value={deptLabels[user?.department || "WORKERS"]}
                  />
                  <InfoRow
                    icon={<BadgeCheck size={16} />}
                    label="نقش"
                    value={roleLabels[user?.role || "USER"]}
                  />
                </div>

                <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-3 text-center text-[12px] text-gray-500 dark:border-[#38383a] dark:text-gray-500">
                  برای تغییر این اطلاعات با مدیر سیستم تماس بگیرید
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  dir = "rtl",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-[#38383a] dark:bg-[#2c2c2e]">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm dark:bg-[#1c1c1e] dark:text-gray-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-[14px] font-bold text-gray-900 dark:text-white" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default SettingsPage;