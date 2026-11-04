import { api } from "../../lib/api";
import type { Vehicle, VehiclePayload, PaginatedResponse } from "../../types/vehicle";

export const vehicleApi = {
  getVehicles: async () => {
    // بک‌اند لیست رو صفحه‌بندی شده برمی‌گردونه، پس فقط results رو برمی‌گردونیم
    const response = await api.get<PaginatedResponse<Vehicle>>("/api/vehicle/list/");
    return response.data.results;
  },
  createVehicle: async (data: VehiclePayload) => {
    const response = await api.post<Vehicle>("/api/vehicle/create/", data);
    return response.data;
  },
  updateVehicle: async (id: number, data: VehiclePayload) => {
    const response = await api.put<Vehicle>(`/api/vehicle/put/${id}/`, data);
    return response.data;
  },
  deleteVehicle: async (id: number) => {
    await api.delete(`/api/vehicle/delete/${id}/`);
  },
};