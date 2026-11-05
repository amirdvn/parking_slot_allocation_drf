import { AlertTriangle } from "lucide-react";
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
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir="rtl"
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div
            className={`rounded-full p-3 ${
              variant === "danger"
                ? "bg-red-100 text-danger dark:bg-red-900/30"
                : "bg-blue-100 text-primary-600 dark:bg-blue-900/30"
            }`}
          >
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-secondary-900">{title}</h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "در حال انجام..." : confirmText}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;