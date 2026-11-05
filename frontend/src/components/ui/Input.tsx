// src/components/ui/Input.tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  showPasswordToggle?: boolean;
}

function Input({
  label,
  error,
  helperText,
  success,
  icon,
  iconPosition = "right",
  showPasswordToggle,
  id,
  className = "",
  type,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const [showPassword, setShowPassword] = useState(false);
  const actualType = showPasswordToggle && type === "password" && showPassword ? "text" : type;

  // آیکون داخلی
  const hasIcon = !!icon || showPasswordToggle;
  const paddingClass = hasIcon
    ? iconPosition === "right"
      ? "pr-11 pl-11"
      : "pl-11 pr-11"
    : "";

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* آیکون سمت راست (پیش‌فرض) */}
        {icon && iconPosition === "right" && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </div>
        )}

        {/* آیکون سمت چپ (مثلاً برای وضعیت موفقیت) */}
        {icon && iconPosition === "left" && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </div>
        )}

        {/* آیکون وضعیت موفقیت خودکار */}
        {success && !error && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        )}

        {/* آیکون خطا خودکار */}
        {error && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-danger">
            <AlertCircle size={18} />
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          className={`
            w-full rounded-lg border bg-surface px-4 py-3
            text-sm text-text-primary outline-none
            transition-all
            placeholder:text-text-secondary/60
            focus:ring-2
            disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary
            ${paddingClass}
            ${
              error
                ? "border-danger focus:border-danger focus:ring-red-100 dark:focus:ring-red-900/30"
                : success
                  ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                  : "border-border focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900/30"
            }
            ${className}
          `}
          {...props}
        />

        {/* دکمه نمایش/مخفی کردن رمز */}
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <span className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} />
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className="text-xs text-text-secondary">{helperText}</span>
      )}
    </div>
  );
}

export default Input;