// src/components/ui/Select.tsx
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function Select({
  label,
  error,
  options,
  placeholder = "انتخاب کنید",
  id,
  className = "",
  ...props
}: SelectProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full cursor-pointer appearance-none rounded-xl border-0 bg-gray-100
            px-4 py-3 pl-10
            text-[15px] text-gray-900 outline-none
            transition-all
            focus:bg-white focus:ring-2 focus:ring-[#007aff]
            dark:bg-[#1c1c1e] dark:text-white
            dark:focus:bg-[#2c2c2e] dark:focus:ring-[#0a84ff]
            ${error ? "ring-2 ring-[#ff3b30]" : ""}
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-white dark:bg-[#1c1c1e]">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1c1c1e]">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={18} />
        </div>
      </div>

      {error && <span className="text-xs text-[#ff3b30] dark:text-[#ff453a]">{error}</span>}
    </div>
  );
}

export default Select;