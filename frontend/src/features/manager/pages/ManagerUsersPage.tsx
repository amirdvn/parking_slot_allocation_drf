// src/features/manager/pages/ManagerUsersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserX, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import type { ManagerUser } from "../../../types/manager";

// مپر برای نمایش نقش‌ها و دپارتمان‌ها به فارسی
const roleTranslations: Record<string, string> = {
  USER: "کاربر عادی",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};
const deptTranslations: Record<string, string> = {
  MANAGEMENT: "مدیریت",
  ADMINISTRATIVE: "اداری",
  WORKERS: "کارگران",
};

function ManagerUsersPage() {
  const queryClient = useQueryClient();
  const [confirmToggle, setConfirmToggle] = useState<ManagerUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["manager-users"],
    queryFn: managerApi.getUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      managerApi.toggleUserStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["manager-users"] });
      toast.success(
        variables.isActive ? "کاربر فعال شد" : "کاربر غیرفعال شد"
      );
      setConfirmToggle(null);
    },
    onError: () => {
      toast.error("خطا در تغییر وضعیت کاربر");
      setConfirmToggle(null);
    },
  });

  if (isLoading) return <div className="p-4">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-secondary-900">مدیریت کاربران</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-background text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">نام و نام خانوادگی</th>
              <th className="px-4 py-3 font-medium">شماره تماس</th>
              <th className="px-4 py-3 font-medium">نقش / دپارتمان</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-background/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.role === "MANAGER" ? (
                      <Shield size={18} className="text-primary-600" />
                    ) : (
                      <UserIcon size={18} className="text-text-secondary" />
                    )}
                    <span className="font-semibold text-secondary-900">
                      {user.full_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono" dir="ltr">
                  {user.phone_number}
                </td>
                <td className="px-4 py-3 text-xs">
                  <p className="font-medium">
                    {roleTranslations[user.role] || user.role}
                  </p>
                  <p className="text-text-secondary">
                    {deptTranslations[user.department] || user.department}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      user.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {user.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant={user.is_active ? "danger" : "primary"}
                    className={`gap-2 py-1.5 px-3 text-xs ${
                      !user.is_active ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                    onClick={() => setConfirmToggle(user)}
                    disabled={toggleMutation.isPending}
                  >
                    {user.is_active ? (
                      <>
                        <UserX size={14} /> غیرفعال کردن
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> فعال کردن
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* دیالوگ تایید تغییر وضعیت */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => {
          if (confirmToggle) {
            toggleMutation.mutate({
              id: confirmToggle.id,
              isActive: !confirmToggle.is_active,
            });
          }
        }}
        title="تغییر وضعیت کاربر"
        description={`آیا از ${
          confirmToggle?.is_active ? "غیرفعال" : "فعال"
        } کردن «${confirmToggle?.full_name}» مطمئن هستید؟`}
        confirmText="بله، تغییر بده"
        variant="primary"
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}

export default ManagerUsersPage;