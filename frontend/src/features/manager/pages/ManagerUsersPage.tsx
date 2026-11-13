// src/features/manager/pages/ManagerUsersPage.tsx
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";
import { UserRow } from "../components/UserRow";
import type { ManagerUser } from "../../../types/manager";
import { useAuth } from "../../auth/AuthContext";

function ManagerUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [confirmToggle, setConfirmToggle] = useState<ManagerUser | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-users", page],
    queryFn: () => managerApi.getUsers(page),
  });

  const users = data?.results || [];
  const total = data?.count || 0;

  // ✅ لیست فیلترشده memoize شده
  const filtered = useMemo(() => {
    if (!search) return users;
    return users.filter(
      (u) =>
        u.full_name.includes(search) ||
        u.phone_number.includes(search) ||
        u.email.includes(search)
    );
  }, [users, search]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      managerApi.toggleUserStatus(id, isActive),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["manager-users"] });
      toast.success(v.isActive ? "فعال شد" : "غیرفعال شد");
      setConfirmToggle(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || "خطا");
      setConfirmToggle(null);
    },
  });

  const changeDetailsMutation = useMutation({
    mutationFn: ({
      id,
      role,
      department,
      isActive,
    }: {
      id: number;
      role?: string;
      department?: string;
      isActive: boolean;
    }) => managerApi.toggleUserStatus(id, isActive, role, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-users"] });
      toast.success("اطلاعات کاربر با موفقیت به‌روز شد");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.detail || "خطا در تغییر اطلاعات"),
  });

  // ✅ mutate در RQ v5 پایدار (stable) است، پس callbackها هم پایدار می‌مونن
  const { mutate: changeDetailsMutate } = changeDetailsMutation;

  // ✅ با useCallback، توابع بین رندرها یکسان می‌مونن و React.memo بیهوده رندر نمی‌ده
  const handleRoleChange = useCallback(
    (user: ManagerUser, newRole: string) => {
      changeDetailsMutate({
        id: user.id,
        role: newRole,
        isActive: user.is_active,
      });
    },
    [changeDetailsMutate]
  );

  const handleDepartmentChange = useCallback(
    (user: ManagerUser, newDepartment: string) => {
      changeDetailsMutate({
        id: user.id,
        department: newDepartment,
        isActive: user.is_active,
      });
    },
    [changeDetailsMutate]
  );

  const handleToggleClick = useCallback((user: ManagerUser) => {
    setConfirmToggle(user);
  }, []);

  return (
    <div>
      <PageHeader
        title="مدیریت کاربران"
        subtitle={`${total} کاربر`}
        toolbar={
          <Input
            placeholder="جستجو بر اساس نام، شماره یا ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1c1c1e]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-[#2c2c2e]">
            <Users size={28} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            کاربری یافت نشد
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <table className="w-full text-right text-[13px]">
            <thead className="border-b border-gray-200 dark:border-[#38383a]">
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 text-right font-medium">کاربر</th>
                <th className="px-4 py-3 text-right font-medium">نقش</th>
                <th className="px-4 py-3 text-right font-medium">دپارتمان</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#38383a]">
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  canManage={!!currentUser?.can_manage_users}
                  onRoleChange={handleRoleChange}
                  onDepartmentChange={handleDepartmentChange}
                  onToggleClick={handleToggleClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() =>
          confirmToggle &&
          toggleMutation.mutate({
            id: confirmToggle.id,
            isActive: !confirmToggle.is_active,
          })
        }
        title="تغییر وضعیت"
        description={`آیا ${confirmToggle?.is_active ? "غیرفعال" : "فعال"} کردن «${confirmToggle?.full_name}» مطمئنید؟`}
        confirmText="تایید"
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}

export default ManagerUsersPage;