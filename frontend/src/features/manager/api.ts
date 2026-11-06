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

  // 👇 اصلاح‌شده: URL درست + مدیریت خطای blob
  downloadEntryExitReport: async (startDate: string, endDate: string) => {
    try {
      const response = await api.get(
        `/api/parking/manager/reports/entry-exit/xlsx/?start=${startDate}&end=${endDate}`,
        { responseType: "blob" }
      );

      // بررسی اگه بک‌اند به جای فایل، ارور JSON برگردونده باشه
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || "خطا در دریافت گزارش");
      }

      // ساخت لینک دانلود
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `entry_exit_report_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // 👇 اگه Axios خطا داد، پیام مناسب پرتاب کن
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.detail || "خطا در دریافت گزارش");
        } catch {
          throw new Error("خطا در دریافت گزارش");
        }
      }
      throw error;
    }
  },

  downloadVehicleReport: async () => {
    try {
      const response = await api.get("/api/vehicle/reports/vehicles/xlsx/", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || "خطا در دریافت گزارش");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `vehicles_report_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.detail || "خطا در دریافت گزارش");
        } catch {
          throw new Error("خطا در دریافت گزارش");
        }
      }
      throw error;
    }
  },
};