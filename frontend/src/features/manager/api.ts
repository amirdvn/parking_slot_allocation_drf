// src/features/manager/api.ts
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type { ManagerParkingRequest } from "../../types/manager";
import type { ManagerUser } from "../../types/manager";

export const managerApi = {
  // دریافت درخواست‌های نیازمند بررسی (Pending + Needs Review)
  getNeedsReviewRequests: async () => {
    const response = await api.get<PaginatedResponse<ManagerParkingRequest>>(
      "/api/parking/requests/needs_review/"
    );
    return response.data.results;
  },

  // دریافت درخواست‌های تایید شده
  getApprovedRequests: async () => {
    const response = await api.get<PaginatedResponse<ManagerParkingRequest>>(
      "/api/parking/requests/approved/"
    );
    return response.data.results;
  },

  // تایید یا رد درخواست
  reviewRequest: async (id: number, data: { status: "APPROVED" | "REJECTED"; rejection_reason?: string }) => {
    const response = await api.patch(`/api/parking/requests/review/${id}/`, data);
    return response.data;
  },
    getUsers: async () => {
    const response = await api.get<PaginatedResponse<ManagerUser>>("/api/parking/manager/users/list/");
    return response.data.results;
  },

  toggleUserStatus: async (userId: number, isActive: boolean) => {
    // بر اساس بک‌اند، برای فعال کردن از activate و برای غیرفعال کردن از deactivate استفاده می‌کنیم
    const endpoint = isActive
      ? `/api/parking/manager/users/activate/${userId}/`
      : `/api/parking/manager/users/deactivate/${userId}/`;

    const response = await api.patch(endpoint);
    return response.data;
  },
};