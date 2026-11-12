// src/features/manager/pages/ManagerUsersPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { managerApi } from "../api";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PageHeader from "../../../components/shared/PageHeader";
import type { ManagerUser } from "../../../types/manager";
import { useAuth } from "../../auth/AuthContext";

const roleLabels: Record<string, string> = {
  USER: "کاربر",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};

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
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role, isActive }: { id: number; role: string; isActive: boolean }) =>
      managerApi.toggleUserStatus(id, isActive, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-users"] });
      toast.success("نقش کاربر با موفقیت تغییر کرد");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "خطا در تغییر نقش"),
  });

  const handleRoleChange = (user: ManagerUser, newRole: string) => {
    changeRoleMutation.mutate({ id: user.id, role: newRole, isActive: user.is_active });
  };

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
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-left font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#38383a]">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-[12px] font-semibold text-white dark:bg-[#0a84ff]">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </p>
                        <p className="text-[11px] text-gray-500" dir="ltr">
                          {user.phone_number}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {currentUser?.can_manage_users ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="cursor-pointer rounded-lg border-0 bg-gray-100 px-2 py-1 text-[12px] outline-none transition-all focus:ring-2 focus:ring-[#007aff] dark:bg-[#2c2c2e] dark:text-white dark:focus:ring-[#0a84ff]"
                      >
                        <option value="USER">کاربر</option>
                        <option value="GUARD">نگهبان</option>
                        <option value="MANAGER">مدیر</option>
                      </select>
                    ) : (
                      roleLabels[user.role] || user.role
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.is_active
                          ? "bg-green-50 text-[#34c759] dark:bg-[#30d158]/10 dark:text-[#30d158]"
                          : "bg-gray-100 text-gray-500 dark:bg-[#2c2c2e] dark:text-gray-500"
                      }`}
                    >
                      {user.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left">
                    <button
                      onClick={() => setConfirmToggle(user)}
                      className="text-[12px] font-medium text-[#007aff] hover:underline dark:text-[#0a84ff]"
                    >
                      {user.is_active ? "غیرفعال" : "فعال"}
                    </button>
                  </td>
                </tr>
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