// src/features/manager/pages/ManagerRequestsPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
  User,
  Car,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerParkingRequest } from "../../../types/manager";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import { Skeleton } from "../../../components/ui/Skeleton";

const statusFilterOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار بررسی" },
  { value: "NEEDS_REVIEW", label: "نیازمند بررسی" },
  { value: "APPROVED", label: "تایید شده" },
];

function ManagerRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"needs_review" | "approved">("needs_review");
  const [rejectingRequest, setRejectingRequest] = useState<ManagerParkingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState<ManagerParkingRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["manager-requests", activeTab],
    queryFn:
      activeTab === "needs_review"
        ? managerApi.getNeedsReviewRequests
        : managerApi.getApprovedRequests,
  });

  // فیلتر
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((req) => {
      const matchesSearch =
        !searchQuery ||
        String(req.id).includes(searchQuery) ||
        req.user_detail?.full_name?.includes(searchQuery) ||
        req.user_detail?.phone_number?.includes(searchQuery) ||
        req.vehicle_detail?.plate_number?.includes(searchQuery) ||
        req.parking_space_detail?.code?.includes(searchQuery);

      const matchesStatus = !statusFilter || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

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
      toast.error(error.response?.data?.detail || "خطا در بررسی درخواست");
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
    <div className="space-y-6">
      {/* 👇 Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 via-purple-700 to-primary-800 p-6 text-white shadow-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/20">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مدیریت درخواست‌ها</h1>
              <p className="mt-1 text-sm text-white/70">
                بررسی و تایید درخواست‌های پارکینگ
              </p>
            </div>
          </div>

          <div className="hidden rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm ring-1 ring-white/20 sm:block">
            <p className="text-xs text-white/70">کل درخواست‌ها</p>
            <p className="text-xl font-bold">{requests?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* 👇 Tabs */}
      <div className="flex rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => {
            setActiveTab("needs_review");
            setSearchQuery("");
            setStatusFilter("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "needs_review"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <Clock size={16} />
          نیازمند بررسی
        </button>
        <button
          onClick={() => {
            setActiveTab("approved");
            setSearchQuery("");
            setStatusFilter("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "approved"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <CheckCircle size={16} />
          تایید شده‌ها
        </button>
      </div>

      {/* 👇 Search & Filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="جستجو بر اساس شناسه، نام، پلاک یا جایگاه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {activeTab === "needs_review" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 👇 Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            icon={<ClipboardList size={48} />}
            title={
              searchQuery || statusFilter
                ? "درخواستی یافت نشد"
                : activeTab === "needs_review"
                  ? "درخواست نیازمند بررسی وجود ندارد"
                  : "هیچ درخواست تایید شده‌ای وجود ندارد"
            }
            description={
              searchQuery || statusFilter
                ? "با فیلترهای فعلی هیچ نتیجه‌ای پیدا نشد."
                : activeTab === "needs_review"
                  ? "همه درخواست‌ها بررسی شده‌اند. کار خوبی کردید!"
                  : "هنوز درخواستی تایید نشده است."
            }
            action={
              (searchQuery || statusFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRequests.map((req) => {
            const isPending = req.status === "PENDING";
            const isNeedsReview = req.status === "NEEDS_REVIEW";
            const isApproved = req.status === "APPROVED";

            return (
              <div
                key={req.id}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-surface p-5 shadow-sm transition-all hover:shadow-lg ${
                  isApproved
                    ? "border-emerald-200 dark:border-emerald-800/50"
                    : isNeedsReview
                      ? "border-orange-200 dark:border-orange-800/50"
                      : "border-border"
                }`}
              >
                {/* نوار بالای کارت */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isApproved
                      ? "bg-gradient-to-l from-emerald-500 to-green-600"
                      : isNeedsReview
                        ? "bg-gradient-to-l from-orange-500 to-amber-600"
                        : "bg-gradient-to-l from-blue-500 to-indigo-600"
                  }`}
                />

                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">درخواست</p>
                    <p className="font-mono text-lg font-bold text-secondary-900">
                      #{req.id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : isNeedsReview
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {isApproved
                      ? "تایید شده"
                      : isNeedsReview
                        ? "نیازمند بررسی"
                        : "در انتظار"}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="mb-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-lg bg-primary-100 p-1.5 dark:bg-primary-900/30">
                      <User size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">
                        {req.user_detail?.full_name}
                      </p>
                      <p className="text-xs text-text-secondary font-mono" dir="ltr">
                        {req.user_detail?.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                      <Car size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-mono font-bold text-secondary-900" dir="ltr">
                      {req.vehicle_detail?.plate_number || "---"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                      <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-secondary-900">
                      جایگاه: <span className="font-bold">{req.parking_space_detail?.code || "---"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar size={14} />
                    <div dir="ltr">
                      <p>{new Date(req.start_time).toLocaleString("fa-IR")}</p>
                      <p>تا {new Date(req.end_time).toLocaleString("fa-IR")}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {activeTab === "needs_review" && (
                  <div className="flex gap-2 border-t border-border pt-3">
                    <Button
                      className="flex-1 bg-gradient-to-l from-emerald-600 to-green-600 shadow-md shadow-emerald-500/20"
                      onClick={() => setConfirmApprove(req)}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle size={16} />
                      تایید
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => setRejectingRequest(req)}
                    >
                      <XCircle size={16} />
                      رد
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* مودال رد */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="رد درخواست پارکینگ"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                درخواست <span className="font-bold">#{rejectingRequest?.id}</span> رد خواهد شد. دلیل را وارد کنید.
              </span>
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              دلیل رد (الزامی)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثلا: جایگاه در این بازه رزرو شده است..."
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleRejectSubmit}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              {reviewMutation.isPending ? "در حال ثبت..." : "تایید و رد"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingRequest(null)}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Approve */}
      <ConfirmDialog
        isOpen={!!confirmApprove}
        onClose={() => setConfirmApprove(null)}
        onConfirm={() => {
          if (confirmApprove) {
            reviewMutation.mutate({ id: confirmApprove.id, status: "APPROVED" });
          }
        }}
        title="تایید درخواست"
        description={`آیا درخواست #${confirmApprove?.id} برای ${confirmApprove?.user_detail?.full_name} تایید شود؟`}
        confirmText="بله، تایید کن"
        variant="primary"
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}

export default ManagerRequestsPage;