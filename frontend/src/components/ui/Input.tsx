// src/components/ui/Input.tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  showPasswordToggle?: boolean;
}

function Input({
  label,
  error,
  helperText,
  icon,
  showPasswordToggle,
  id,
  className = "",
  type,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const [showPassword, setShowPassword] = useState(false);
  const actualType = showPasswordToggle && type === "password" && showPassword ? "text" : type;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          className={`
            w-full rounded-xl border border-gray-200 bg-white px-4 py-3
            text-[15px] text-gray-900 outline-none shadow-sm
            transition-all
            placeholder:text-gray-400
            focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
            dark:border-[#38383a] dark:bg-[#1c1c1e] dark:text-white dark:placeholder:text-gray-500
            dark:focus:border-[#0a84ff] dark:focus:ring-[#0a84ff]/20 dark:shadow-none
            ${icon ? "pr-11" : ""}
            ${showPasswordToggle ? "pl-11" : ""}
            ${error ? "border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[#ff3b30]/20 dark:border-[#ff453a]" : ""}
            ${className}
          `}
          {...props}
        />

        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={showPassword ? "مخفی کردن" : "نمایش"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span className="flex items-center gap-1 text-xs text-[#ff3b30] dark:text-[#ff453a]">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-gray-500 dark:text-gray-500">{helperText}</span>
      )}
    </div>
  );
}

export default Input;