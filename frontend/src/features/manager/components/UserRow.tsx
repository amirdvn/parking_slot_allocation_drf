// src/features/manager/components/UserRow.tsx
import { memo } from "react";
import type { ManagerUser } from "../../../types/manager";

const roleLabels: Record<string, string> = {
  USER: "کاربر",
  GUARD: "نگهبان",
  MANAGER: "مدیر",
};

const departmentLabels: Record<string, string> = {
  MANAGEMENT: "مدیریت",
  ADMINISTRATIVE: "اداری",
  WORKERS: "کارگران",
};

interface UserRowProps {
  user: ManagerUser;
  canManage: boolean;
  onRoleChange: (user: ManagerUser, newRole: string) => void;
  onDepartmentChange: (user: ManagerUser, newDepartment: string) => void;
  onToggleClick: (user: ManagerUser) => void;
}

function UserRowComponent({
  user,
  canManage,
  onRoleChange,
  onDepartmentChange,
  onToggleClick,
}: UserRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-[#2c2c2e]/50">
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
        {canManage ? (
          <select
            value={user.role}
            onChange={(e) => onRoleChange(user, e.target.value)}
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
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        {canManage ? (
          <select
            value={user.department}
            onChange={(e) => onDepartmentChange(user, e.target.value)}
            className="cursor-pointer rounded-lg border-0 bg-gray-100 px-2 py-1 text-[12px] outline-none transition-all focus:ring-2 focus:ring-[#007aff] dark:bg-[#2c2c2e] dark:text-white dark:focus:ring-[#0a84ff]"
          >
            <option value="MANAGEMENT">مدیریت</option>
            <option value="ADMINISTRATIVE">اداری</option>
            <option value="WORKERS">کارگران</option>
          </select>
        ) : (
          departmentLabels[user.department] || user.department
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
          onClick={() => onToggleClick(user)}
          className="text-[12px] font-medium text-[#007aff] hover:underline dark:text-[#0a84ff]"
        >
          {user.is_active ? "غیرفعال" : "فعال"}
        </button>
      </td>
    </tr>
  );
}

// React.memo: فقط وقتی prop عوض شه دوباره رندر می‌شه
export const UserRow = memo(UserRowComponent);