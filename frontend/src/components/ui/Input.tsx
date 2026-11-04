
import type { InputHTMLAttributes } from "react";
import { useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;

  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

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

      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? errorId : helperText ? helperId : undefined
        }
        className={`
          w-full rounded-lg border bg-surface px-4 py-3
          text-sm text-text-primary outline-none
          transition-colors
          placeholder:text-gray-400
          focus:border-primary-500 focus:ring-2 focus:ring-primary-100
          disabled:cursor-not-allowed disabled:bg-gray-100
          ${
            error
              ? "border-danger focus:border-danger focus:ring-red-100"
              : "border-border"
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span id={helperId} className="text-xs text-text-secondary">
          {helperText}
        </span>
      )}
    </div>
  );
}

export default Input;
