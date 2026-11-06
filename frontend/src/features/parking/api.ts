
// src/features/parking/api.ts

import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type {
  ParkingRequest,
  ParkingSpace,
  CreateRequestPayload,
  ParkingSpacePayload,
} from "../../types/parking";

export const parkingApi = {
  // دریافت تمام جایگاه‌ها
  // برای مدیریت و نمایش درخواست‌های قبلی
  getSpaces: async () => {
    const response = await api.get<PaginatedResponse<ParkingSpace>>(
      "/api/parking/list/"
    );

    return response.data.results;
  },

  // دریافت جایگاه‌های متناسب با خودروی انتخاب‌شده
  getAvailableSpaces: async (vehicleId: string) => {
    const response = await api.get<PaginatedResponse<ParkingSpace>>(
      "/api/parking/list/",
      {
        params: {
          vehicle_id: vehicleId,
        },
      }
    );

    return response.data.results;
  },

  getMyRequests: async () => {
    const response = await api.get<PaginatedResponse<ParkingRequest>>(
      "/api/parking/requests/list/"
    );

    return response.data.results;
  },

  createRequest: async (data: CreateRequestPayload) => {
    const response = await api.post<ParkingRequest>(
      "/api/parking/requests/create/",
      data
    );

    return response.data;
  },

  cancelRequest: async (id: number, reason: string) => {
    const response = await api.patch(
      `/api/parking/requests/cancel/${id}/`,
      {
        cancellation_reason: reason,
      }
    );

    return response.data;
  },

  // بخش مدیریت

  createSpace: async (data: ParkingSpacePayload) => {
    const response = await api.post<ParkingSpace>(
      "/api/parking/create/",
      data
    );

    return response.data;
  },

  updateSpace: async (
    id: string,
    data: Partial<ParkingSpacePayload>
  ) => {
    const response = await api.patch<ParkingSpace>(
      `/api/parking/update/${id}/`,
      data
    );

    return response.data;
  },

  deleteSpace: async (id: string) => {
    await api.delete(`/api/parking/delete/${id}/`);
  },

  // انسداد جایگاه

  getBlocks: async () => {
    const response = await api.get<PaginatedResponse<any>>(
      "/api/parking/blocks/list/"
    );

    return response.data.results;
  },

  createBlock: async (data: {
    parking_space: string;
    start_time: string;
    end_time: string;
    reason: string;
    description?: string;
  }) => {
    const response = await api.post(
      "/api/parking/blocks/create/",
      data
    );

    return response.data;
  },

  deleteBlock: async (id: number) => {
    await api.delete(`/api/parking/blocks/delete/${id}/`);
  },
};
