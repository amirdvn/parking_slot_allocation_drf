// src/features/manager/api.ts
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type {
  ManagerParkingRequest,
  ManagerUser,
  ManagerDashboardData,
} from "../../types/manager";

export const managerApi = {
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

  // 👇 حالا صفحه‌بندی شده برمی‌گردونه (کامل PaginatedResponse)
  getUsers: async (page = 1) => {
    const response = await api.get<PaginatedResponse<ManagerUser>>(
      `/api/parking/manager/users/list/?page=${page}`
    );
    return response.data;
  },

  toggleUserStatus: async (userId: number, isActive: boolean) => {
    const endpoint = isActive
      ? `/api/parking/manager/users/activate/${userId}/`
      : `/api/parking/manager/users/deactivate/${userId}/`;
    const response = await api.patch(endpoint);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get<ManagerDashboardData>("/api/parking/manager/dashboard/");
    return response.data;
  },

  downloadEntryExitReport: async (startDate: string, endDate: string) => {
    const response = await api.get(
      `/api/parking/manager/reports/entryـexit/xlsx/?start=${startDate}&end=${endDate}`,
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `entry_exit_report_${startDate}_to_${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};