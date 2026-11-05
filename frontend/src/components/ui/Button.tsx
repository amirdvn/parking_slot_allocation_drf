// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30 active:shadow-sm",
  secondary:
    "bg-secondary-800 text-white shadow-md hover:bg-secondary-900",
  danger:
    "bg-gradient-to-l from-red-600 to-red-500 text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30",
  outline:
    "border border-border bg-surface text-text-primary hover:bg-background hover:border-primary-300",
  ghost:
    "text-text-secondary hover:bg-background hover:text-secondary-900",
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
        rounded-lg px-5 py-2.5
        text-sm font-semibold
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none
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