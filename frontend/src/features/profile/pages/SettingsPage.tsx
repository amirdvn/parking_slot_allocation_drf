// src/features/profile/pages/SettingsPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  User,
  Phone,
  Save,
  Mail,
  Building2,
  BadgeCheck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  AtSign,
  Smartphone,
  ArrowLeft,
  Info,
} from "lucide-react";
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

const roleBadgeColors: Record<string, string> = {
  USER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  GUARD: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MANAGER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

type SectionKey = "profile" | "phone" | "account";

interface SidebarItem {
  key: SectionKey;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const sidebarItems: SidebarItem[] = [
  {
    key: "profile",
    icon: <User size={18} />,
    title: "ویرایش پروفایل",
    description: "نام و توضیحات",
  },
  {
    key: "phone",
    icon: <Phone size={18} />,
    title: "تغییر شماره",
    description: "شماره موبایل",
  },
  {
    key: "account",
    icon: <ShieldCheck size={18} />,
    title: "اطلاعات حساب",
    description: "نقش و دپارتمان",
  },
];

function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");

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
    mutationFn: (data: ChangePhoneFormValues) =>
      profileApi.sendChangePhoneOtp(data.phone_number),
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
      profileApi.verifyChangePhoneOtp({
        phone_number: pendingPhone,
        code: Number(data.code),
      }),
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

  const initial = user?.full_name?.charAt(0) || "؟";
  const avatarGradient =
    user?.role === "MANAGER"
      ? "from-purple-500 to-purple-700"
      : user?.role === "GUARD"
        ? "from-blue-500 to-blue-700"
        : "from-emerald-500 to-emerald-700";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-600 via-primary-700 to-indigo-900 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl font-bold shadow-2xl ring-4 ring-white/20 ${avatarGradient}`}
            >
              {initial}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-primary-700">
              <CheckCircle2 size={14} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{user?.full_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleBadgeColors[user?.role || "USER"]}`}
              >
                <BadgeCheck size={12} />
                {roleTranslations[user?.role || "USER"]}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm ring-1 ring-white/20">
                {deptTranslations[user?.department || "WORKERS"]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                <span dir="ltr">{user?.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                <span dir="ltr">{user?.phone_number}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-2">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
            تنظیمات
          </p>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`group relative flex w-full items-center gap-3 rounded-xl border p-3 text-right transition-all ${
                activeSection === item.key
                  ? "border-primary-200 bg-gradient-to-l from-primary-50 to-white shadow-sm dark:border-primary-800/50 dark:from-primary-900/20 dark:to-surface"
                  : "border-transparent bg-surface hover:border-border hover:bg-background/50"
              }`}
            >
              {activeSection === item.key && (
                <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-primary-600" />
              )}
              <div
                className={`rounded-lg p-2 transition-colors ${
                  activeSection === item.key
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "bg-background text-text-secondary group-hover:text-secondary-900"
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-bold ${
                    activeSection === item.key
                      ? "text-primary-700 dark:text-primary-400"
                      : "text-secondary-900"
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0">
          {/* بخش پروفایل */}
          {activeSection === "profile" && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm animate-fade-in">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-xl bg-primary-100 p-2.5 dark:bg-primary-900/30">
                  <User size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="font-bold text-secondary-900">اطلاعات شخصی</h2>
                  <p className="text-xs text-text-secondary">
                    نام و توضیحات خود را می‌توانید ویرایش کنید
                  </p>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit((data) =>
                  updateProfileMutation.mutate(data)
                )}
                className="space-y-5"
              >
                <Input
                  label="نام و نام خانوادگی"
                  placeholder="مثلا: امیر داوری"
                  icon={<User size={18} />}
                  error={profileForm.formState.errors.full_name?.message}
                  {...profileForm.register("full_name")}
                />

                {/* ایمیل (readonly) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">
                    ایمیل
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-secondary">
                    <AtSign size={18} />
                    <span dir="ltr">{user?.email}</span>
                    <span className="mr-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      غیرقابل تغییر
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    placeholder="توضیح کوتاه درباره خودتان..."
                    rows={4}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30"
                    {...profileForm.register("description")}
                  />
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-l from-primary-600 to-primary-500 shadow-md shadow-primary-600/20"
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
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm animate-fade-in">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/30">
                  <Phone size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-secondary-900">تغییر شماره موبایل</h2>
                  <p className="text-xs text-text-secondary">
                    شماره جدید را تایید کنید
                  </p>
                </div>
              </div>

              {/* Stepper */}
              <div className="mb-6 flex items-center justify-center">
                <div className="flex items-center">
                  <StepIndicator
                    number={1}
                    label="شماره جدید"
                    active={!otpSent}
                    completed={otpSent}
                  />
                  <div
                    className={`mx-2 h-0.5 w-16 transition-colors ${
                      otpSent ? "bg-emerald-500" : "bg-border"
                    }`}
                  />
                  <StepIndicator
                    number={2}
                    label="کد تایید"
                    active={otpSent}
                    completed={false}
                  />
                </div>
              </div>

              {/* شماره فعلی */}
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-4 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-surface">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    شماره فعلی شما
                  </p>
                  <p
                    className="mt-0.5 font-mono text-base font-bold text-emerald-900 dark:text-emerald-200"
                    dir="ltr"
                  >
                    {user?.phone_number}
                  </p>
                </div>
                <CheckCircle2
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>

              {!otpSent ? (
                <form
                  onSubmit={phoneForm.handleSubmit((data) =>
                    sendOtpMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                    <p className="flex items-start gap-2">
                      <Info size={14} className="mt-0.5 shrink-0" />
                      برای تغییر شماره، ابتدا شماره جدید را وارد کنید و کد تایید دریافت نمایید.
                    </p>
                  </div>

                  <Input
                    label="شماره موبایل جدید"
                    placeholder="09123456789"
                    dir="ltr"
                    icon={<Phone size={18} />}
                    error={phoneForm.formState.errors.phone_number?.message}
                    {...phoneForm.register("phone_number")}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendOtpMutation.isPending}
                      className="bg-gradient-to-l from-amber-500 to-orange-500 shadow-md shadow-amber-500/20"
                    >
                      <ArrowLeft size={16} />
                      {sendOtpMutation.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={otpForm.handleSubmit((data) =>
                    verifyOtpMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                    <p className="flex items-start gap-2">
                      <KeyRound size={16} className="mt-0.5 shrink-0" />
                      <span>
                        کد ۴ رقمی ارسال شده به{" "}
                        <span className="font-bold" dir="ltr">
                          {pendingPhone}
                        </span>{" "}
                        را وارد کنید.
                      </span>
                    </p>
                  </div>

                  <Input
                    label="کد تایید"
                    placeholder="----"
                    dir="ltr"
                    icon={<KeyRound size={18} />}
                    className="text-center text-2xl tracking-widest"
                    maxLength={4}
                    error={otpForm.formState.errors.code?.message}
                    {...otpForm.register("code")}
                  />

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
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
                      تغییر شماره
                    </Button>
                    <Button
                      type="submit"
                      disabled={verifyOtpMutation.isPending}
                      className="bg-gradient-to-l from-emerald-600 to-green-600 shadow-md shadow-emerald-500/20"
                    >
                      {verifyOtpMutation.isPending ? "در حال بررسی..." : "تایید و تغییر"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* بخش اطلاعات حساب */}
          {activeSection === "account" && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/30">
                    <ShieldCheck size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-secondary-900">اطلاعات حساب</h2>
                    <p className="text-xs text-text-secondary">
                      این اطلاعات توسط مدیر سیستم تعیین شده است
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard
                    icon={<Mail size={18} />}
                    label="ایمیل"
                    value={user?.email || "---"}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    dir="ltr"
                  />
                  <InfoCard
                    icon={<Phone size={18} />}
                    label="شماره موبایل"
                    value={user?.phone_number || "---"}
                    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    dir="ltr"
                  />
                  <InfoCard
                    icon={<Building2 size={18} />}
                    label="دپارتمان"
                    value={deptTranslations[user?.department || "WORKERS"]}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  />
                  <InfoCard
                    icon={<BadgeCheck size={18} />}
                    label="نقش"
                    value={roleTranslations[user?.role || "USER"]}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center">
                <p className="text-sm text-text-secondary">
                  برای تغییر اطلاعات حساب، با مدیر سیستم تماس بگیرید.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 👇 Step Indicator
function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
          completed
            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30"
            : active
              ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30"
              : "border-2 border-border bg-surface text-text-secondary"
        }`}
      >
        {completed ? <CheckCircle2 size={16} /> : number}
      </div>
      <p
        className={`text-xs font-medium ${
          active || completed ? "text-secondary-900" : "text-text-secondary"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

// 👇 Info Card
function InfoCard({
  icon,
  label,
  value,
  color,
  dir = "rtl",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-4 transition-colors hover:bg-background">
      <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="mt-0.5 truncate font-bold text-secondary-900" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default SettingsPage;