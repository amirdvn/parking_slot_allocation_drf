// src/features/manager/pages/ManagerRequestsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerParkingRequest } from "../../../types/manager";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار",
  NEEDS_REVIEW: "نیازمند بررسی",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
  IN_USE: "در حال استفاده",
  COMPLETED: "تکمیل شده",
  CANCELED: "لغو شده",
};

function ManagerRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"needs_review" | "approved">("needs_review");
  const [rejectingRequest, setRejectingRequest] = useState<ManagerParkingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState<ManagerParkingRequest | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["manager-requests", activeTab],
    queryFn:
      activeTab === "needs_review"
        ? managerApi.getNeedsReviewRequests
        : managerApi.getApprovedRequests,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: number;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => managerApi.reviewRequest(id, { status, rejection_reason: reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["manager-requests"] });
      toast.success(
        variables.status === "APPROVED" ? "درخواست تایید شد" : "درخواست رد شد"
      );
      setRejectingRequest(null);
      setRejectionReason("");
      setConfirmApprove(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا");
    },
  });

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error("دلیل رد را وارد کنید");
      return;
    }
    reviewMutation.mutate({
      id: rejectingRequest!.id,
      status: "REJECTED",
      reason: rejectionReason,
    });
  };

  return (
    <div>
      <PageHeader
        title="مدیریت درخواست‌ها"
        subtitle={`${requests?.length || 0} درخواست`}
        toolbar={
          <div className="flex h-full gap-1 rounded-xl bg-gray-100 p-1 dark:bg-[#2c2c2e]">
            <button
              onClick={() => setActiveTab("needs_review")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "needs_review"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-[#1c1c1e] dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Clock size={14} />
              نیازمند بررسی
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === "approved"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-[#1c1c1e] dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <CheckCircle size={14} />
              تایید شده‌ها
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]"
            />
          ))}
        </div>
      ) : !requests?.length ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <ClipboardList size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {activeTab === "needs_review"
              ? "درخواستی نیازمند بررسی نیست"
              : "درخواست تایید شده‌ای نیست"}
          </h3>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white">
                      #{req.id}
                    </p>
                    {activeTab === "approved" && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]">
                        {statusLabels[req.status] || req.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                    <p>
                      کاربر:{" "}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {req.user_detail?.full_name}
                      </span>{" "}
                      <span dir="ltr" className="font-mono">
                        ({req.user_detail?.phone_number})
                      </span>
                    </p>
                    <p>
                      خودرو:{" "}
                      <span
                        className="font-mono font-medium text-gray-900 dark:text-white"
                        dir="ltr"
                      >
                        {req.vehicle_detail?.plate_number || "---"}
                      </span>
                    </p>
                    <p>
                      جایگاه:{" "}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {req.parking_space_detail?.code || "---"}
                      </span>
                    </p>
                    <p dir="ltr" className="text-[11px]">
                      {new Date(req.start_time).toLocaleString("fa-IR")} →{" "}
                      {new Date(req.end_time).toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>

                {activeTab === "needs_review" && (
                  <div className="flex gap-2 sm:flex-col">
                    <Button
                      onClick={() => setConfirmApprove(req)}
                      disabled={reviewMutation.isPending}
                      className="flex-1 gap-1.5 text-[12px]"
                    >
                      <CheckCircle size={14} />
                      تایید
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setRejectingRequest(req)}
                      className="flex-1 gap-1.5 text-[12px]"
                    >
                      <XCircle size={14} />
                      رد
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="رد درخواست"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            درخواست #{rejectingRequest?.id} رد خواهد شد. دلیل را وارد کنید.
          </p>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              دلیل رد
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثلاً: جایگاه در این بازه رزرو شده است"
              rows={3}
              className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-[15px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#007aff] dark:bg-[#1c1c1e] dark:text-white dark:focus:bg-[#2c2c2e] dark:focus:ring-[#0a84ff]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleRejectSubmit}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              {reviewMutation.isPending ? "..." : "تایید و رد"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectingRequest(null)}
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmApprove}
        onClose={() => setConfirmApprove(null)}
        onConfirm={() => {
          if (confirmApprove) {
            reviewMutation.mutate({
              id: confirmApprove.id,
              status: "APPROVED",
            });
          }
        }}
        title="تایید درخواست"
        description={`آیا درخواست #${confirmApprove?.id} برای ${confirmApprove?.user_detail?.full_name} تایید شود؟`}
        confirmText="تایید"
        variant="primary"
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}

export default ManagerRequestsPage;