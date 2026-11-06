// src/features/guard/api.ts
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type { ParkingRequest } from "../../types/parking";
import type { EntryExitLog, GuardDashboardData } from "../../types/guard";

export const guardApi = {
  searchVehicle: async (plateNumber: string) => {
    const response = await api.get<PaginatedResponse<ParkingRequest>>(
      `/api/parking/guard/vehicle/search/?plate_number=${plateNumber}`
    );
    return response.data.results;
  },

  recordEntry: async (data: { vehicle: number; parking_request?: number; description?: string }) => {
    const response = await api.post("/api/parking/entry_exit/create/", data);
    return response.data;
  },

  recordExit: async (logId: number) => {
    const response = await api.patch(`/api/parking/entry_exit/exit/${logId}/`);
    return response.data;
  },

  getLogs: async () => {
    const response = await api.get<PaginatedResponse<EntryExitLog>>("/api/parking/entry_exit/list/");
    return response.data.results;
  },

  // 👇 جدید: دریافت درخواست‌های تایید شده که آماده ورود هستند
  getApprovedRequests: async () => {
    const response = await api.get<PaginatedResponse<any>>("/api/parking/requests/approved/guard/");
    return response.data.results;
  },

  getDashboard: async () => {
    const response = await api.get<GuardDashboardData>("/api/parking/guard/dashboard/");
    return response.data;
  },
};