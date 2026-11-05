// src/components/ui/Select.tsx
import type { SelectHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function Select({
  label,
  error,
  helperText,
  options,
  placeholder = "انتخاب کنید...",
  id,
  className = "",
  ...props
}: SelectProps) {
  const inputId = id ?? props.name;

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
        <select
          id={inputId}
          className={`
            w-full cursor-pointer appearance-none rounded-lg border bg-surface
            px-4 py-3 pl-10
            text-sm text-text-primary outline-none
            transition-all
            focus:ring-2
            disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary
            ${
              error
                ? "border-danger focus:border-danger focus:ring-red-100 dark:focus:ring-red-900/30"
                : "border-border focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900/30"
            }
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* فلش سفارشی */}
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          <ChevronDown size={16} />
        </div>

        {/* آیکون خطا */}
        {error && (
          <div className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-danger">
            <AlertCircle size={16} />
          </div>
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

export default Select;