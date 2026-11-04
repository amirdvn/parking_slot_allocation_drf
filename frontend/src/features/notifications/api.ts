import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/vehicle";
import type { Notification, UnreadCountResponse } from "../../types/notification";

export const notificationsApi = {
  getNotifications: async () => {
    const response = await api.get<PaginatedResponse<Notification>>("/api/notifications/list/");
    return response.data.results;
  },

  markAsRead: async (id: number) => {
    await api.post(`/api/notifications/read/${id}/`);
  },

  markAllAsRead: async () => {
    await api.post("/api/notifications/read_all/");
  },

  getUnreadCount: async () => {
    const response = await api.get<UnreadCountResponse>("/api/notifications/unread_count/");
    return response.data;
  },
};