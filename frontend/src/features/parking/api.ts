// src/features/parking/api.ts
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type { ParkingRequest, ParkingSpace, CreateRequestPayload } from "../../types/parking";

export const parkingApi = {
  // دریافت لیست جایگاه‌ها
  getSpaces: async () => {
    const response = await api.get<PaginatedResponse<ParkingSpace>>("/api/parking/list/");
    return response.data.results;
  },

  // دریافت درخواست‌های کاربر
  getMyRequests: async () => {
    const response = await api.get<PaginatedResponse<ParkingRequest>>("/api/parking/requests/list/");
    return response.data.results;
  },

  // ثبت درخواست جدید
  createRequest: async (data: CreateRequestPayload) => {
    const response = await api.post<ParkingRequest>("/api/parking/requests/create/", data);
    return response.data;
  },

  // لغو درخواست
  cancelRequest: async (id: number, reason: string) => {
    const response = await api.patch(`/api/parking/requests/cancel/${id}/`, {
      cancellation_reason: reason,
    });
    return response.data;
  },
};