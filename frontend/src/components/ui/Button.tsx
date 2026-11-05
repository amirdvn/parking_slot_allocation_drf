// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#007aff] text-white hover:bg-[#0069d9] active:bg-[#005cbf] dark:bg-[#0a84ff] dark:hover:bg-[#0077e6]",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 dark:bg-[#2c2c2e] dark:text-white dark:hover:bg-[#3a3a3c]",
  danger:
    "bg-[#ff3b30] text-white hover:bg-[#e63429] active:bg-[#cc2e24] dark:bg-[#ff453a] dark:hover:bg-[#e63e34]",
  outline:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-[#38383a] dark:bg-transparent dark:text-white dark:hover:bg-[#1c1c1e]",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2c2c2e] dark:hover:text-white",
};

function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-4 py-2.5
        text-[15px] font-medium
        transition-all duration-150
        disabled:cursor-not-allowed disabled:opacity-40
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;