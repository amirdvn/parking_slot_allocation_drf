// src/components/ui/ConfirmDialog.tsx
import { useEffect } from "react";
import Button from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تایید",
  cancelText = "انصراف",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in dark:bg-black/60">
      <div className="w-full max-w-[340px] animate-scale-in overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1c1c1e]" dir="rtl">
        <div className="p-5 text-center">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-[#38383a]">
          <div className="grid grid-cols-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="border-l border-gray-200 py-3 text-[15px] font-medium text-[#007aff] transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-[#38383a] dark:text-[#0a84ff] dark:hover:bg-[#2c2c2e]"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`py-3 text-[15px] font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-[#2c2c2e] ${
                variant === "danger"
                  ? "text-[#ff3b30] dark:text-[#ff453a]"
                  : "text-[#007aff] dark:text-[#0a84ff]"
              }`}
            >
              {isLoading ? "..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;