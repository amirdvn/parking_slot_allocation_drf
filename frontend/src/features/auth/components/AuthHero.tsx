// src/features/auth/components/AuthHero.tsx
import { ParkingSquare, Shield, Zap, Clock, Users } from "lucide-react";

function AuthHero() {
  return (
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

      {/* شکل‌های شناور */}
      <div className="absolute -top-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* محتوای اصلی */}
      <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
        {/* لوگو */}
        <div className="mb-10 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl" />
            <div className="relative rounded-3xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/20">
              <ParkingSquare size={72} className="text-white" />
            </div>
          </div>
        </div>

        {/* عنوان */}
        <h2 className="mb-4 text-center text-4xl font-bold leading-tight animate-fade-in">
          پارکینگ هوشمند
        </h2>
        <p className="mb-12 max-w-md text-center text-lg leading-relaxed text-white/80 animate-fade-in">
          مدیریت ساده، سریع و هوشمند فضای پارکینگ سازمان شما
        </p>

        {/* Feature Cards */}
        <div className="grid w-full max-w-md grid-cols-1 gap-4">
          <FeatureCard
            icon={<Zap size={22} />}
            title="تخصیص هوشمند جایگاه"
            description="اختصاص خودکار جایگاه بر اساس نوع خودرو و نیاز کاربر"
          />
          <FeatureCard
            icon={<Shield size={22} />}
            title="امنیت بالا"
            description="احراز هویت دو مرحله‌ای با رمز یکبار مصرف (OTP)"
          />
          <FeatureCard
            icon={<Clock size={22} />}
            title="مدیریت زمان"
            description="رزرو جایگاه در بازه‌های زمانی دلخواه با تقویم هوشمند"
          />
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center gap-2 text-sm text-white/60">
          <Users size={16} />
          <span>مورد اعتماد تیم‌های حرفه‌ای</span>
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
    <div className="group rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/15 hover:ring-white/30">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/20 p-2.5 text-white transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthHero;