import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type { ParkingRequest } from "../../types/parking";
import type { EntryExitLog } from "../../types/guard";

export const guardApi = {
  // جستجوی پلاک
  searchVehicle: async (plateNumber: string) => {
    const response = await api.get<ParkingRequest[]>(
      `/api/parking/guard/vehicle/search/?plate_number=${plateNumber}`
    );
    return response.data;
  },

  // ثبت ورود
  recordEntry: async (data: { vehicle: number; parking_request?: number; description?: string }) => {
    const response = await api.post("/api/parking/entry_exit/create/", data);
    return response.data;
  },

  // ثبت خروج
  recordExit: async (logId: number) => {
    const response = await api.patch(`/api/parking/entry_exit/exit/${logId}/`);
    return response.data;
  },

  // دریافت لاگ‌های ورود و خروج
  getLogs: async () => {
    const response = await api.get<PaginatedResponse<EntryExitLog>>("/api/parking/entry_exit/list/");
    return response.data.results;
  },
};