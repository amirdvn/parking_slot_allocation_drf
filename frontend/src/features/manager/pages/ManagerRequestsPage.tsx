import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import type { ManagerParkingRequest } from "../../../types/manager";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import TableToolbar from "../../../components/ui/TableToolbar";
import EmptyState from "../../../components/ui/EmptyState";
import { TableSkeleton } from "../../../components/ui/Skeleton";

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

  // فیلتر کردن
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
      toast.success(variables.status === "APPROVED" ? "درخواست تایید شد" : "درخواست رد شد");
      setRejectingRequest(null);
      setRejectionReason("");
      setConfirmApprove(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "خطا در بررسی درخواست");
    },
  });

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) return;
    reviewMutation.mutate({
      id: rejectingRequest!.id,
      status: "REJECTED",
      reason: rejectionReason,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-secondary-900">مدیریت درخواست‌ها</h1>

      {/* تب‌ها */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab("needs_review");
            setSearchQuery("");
            setStatusFilter("");
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "needs_review"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <Clock size={16} /> نیازمند بررسی
        </button>
        <button
          onClick={() => {
            setActiveTab("approved");
            setSearchQuery("");
            setStatusFilter("");
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "approved"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-secondary hover:text-secondary-900"
          }`}
        >
          <CheckCircle size={16} /> تایید شده‌ها
        </button>
      </div>

      {/* نوار ابزار */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="جستجو بر اساس شناسه، نام، پلاک یا جایگاه..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusFilterOptions}
        filterLabel="فیلتر وضعیت"
        resultCount={filteredRequests.length}
        totalCount={requests?.length}
      />

      {/* جدول */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
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
                  ? "همه درخواست‌ها بررسی شده‌اند. کار خوبی کردی!"
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
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-background text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">کاربر</th>
                <th className="px-4 py-3 font-medium">خودرو / جایگاه</th>
                <th className="px-4 py-3 font-medium">زمان</th>
                {activeTab === "needs_review" && (
                  <th className="px-4 py-3 font-medium">عملیات</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-mono">#{req.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{req.user_detail?.full_name}</p>
                    <p className="text-xs text-text-secondary" dir="ltr">
                      {req.user_detail?.phone_number}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold" dir="ltr">
                      {req.vehicle_detail?.plate_number || "---"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      جایگاه: {req.parking_space_detail?.code || "---"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs" dir="ltr">
                    <p>شروع: {new Date(req.start_time).toLocaleString("fa-IR")}</p>
                    <p>پایان: {new Date(req.end_time).toLocaleString("fa-IR")}</p>
                  </td>
                  {activeTab === "needs_review" && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 py-1.5 px-3 text-xs gap-1"
                          onClick={() => setConfirmApprove(req)}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle size={14} /> تایید
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1.5 px-3 text-xs gap-1"
                          onClick={() => setRejectingRequest(req)}
                        >
                          <XCircle size={14} /> رد
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* مودال رد */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="رد درخواست پارکینگ"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            لطفاً دلیل رد درخواست{" "}
            <span className="font-bold">#{rejectingRequest?.id}</span> را وارد کنید (الزامی):
          </p>
          <Input
            label="دلیل رد"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="مثلا: جایگاه در این بازه رزرو شده است"
          />
          <div className="flex gap-3 mt-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleRejectSubmit}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              ثبت و رد درخواست
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

      {/* دیالوگ تایید */}
      <ConfirmDialog
        isOpen={!!confirmApprove}
        onClose={() => setConfirmApprove(null)}
        onConfirm={() => {
          if (confirmApprove) {
            reviewMutation.mutate({ id: confirmApprove.id, status: "APPROVED" });
          }
        }}
        title="تایید درخواست"
        description={`آیا درخواست #${confirmApprove?.id} تایید شود؟`}
        confirmText="بله، تایید کن"
        variant="primary"
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}

export default ManagerRequestsPage;