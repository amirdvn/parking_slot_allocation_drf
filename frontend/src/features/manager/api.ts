// src/features/manager/api.ts
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type {
  ManagerParkingRequest,
  ManagerUser,
  ManagerDashboardData,
  ManagerVehicle,
} from "../../types/manager";

export const managerApi = {
  // ... کدهای قبلی برای درخواست‌ها و کاربران ...

  getNeedsReviewRequests: async () => {
    const response = await api.get<PaginatedResponse<ManagerParkingRequest>>(
      "/api/parking/requests/needs_review/"
    );
    return response.data.results;
  },

  getApprovedRequests: async () => {
    const response = await api.get<PaginatedResponse<ManagerParkingRequest>>(
      "/api/parking/requests/approved/"
    );
    return response.data.results;
  },

  reviewRequest: async (
    id: number,
    data: { status: "APPROVED" | "REJECTED"; rejection_reason?: string }
  ) => {
    const response = await api.patch(`/api/parking/requests/review/${id}/`, data);
    return response.data;
  },

  getUsers: async (page = 1) => {
    const response = await api.get<PaginatedResponse<ManagerUser>>(
      `/api/parking/manager/users/list/?page=${page}`
    );
    return response.data;
  },

  // 👇 اینجا هم is_active رو به بدنه اضافه کردیم
  toggleUserStatus: async (userId: number, isActive: boolean) => {
    const endpoint = isActive
      ? `/api/parking/manager/users/activate/${userId}/`
      : `/api/parking/manager/users/deactivate/${userId}/`;

    const response = await api.patch(endpoint, { is_active: isActive });
    return response.data;
  },

  getAllVehicles: async (page = 1) => {
    const response = await api.get<PaginatedResponse<ManagerVehicle>>(
      `/api/parking/manager/vehicles/list/?page=${page}`
    );
    return response.data;
  },

  // 👇 اصلاح باگ اصلی: ارسال is_active در بدنه درخواست
  toggleVehicleStatus: async (vehicleId: number, isActive: boolean) => {
    const endpoint = isActive
      ? `/api/parking/manager/vehicles/activate/${vehicleId}/`
      : `/api/parking/manager/vehicles/deactivate/${vehicleId}/`;

    const response = await api.patch(endpoint, { is_active: isActive });
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get<ManagerDashboardData>("/api/parking/manager/dashboard/");
    return response.data;
  },

  // ... ادامه کدها برای دانلود گزارش‌ها ...
};