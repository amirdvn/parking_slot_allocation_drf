export type NotificationType = "REQUEST_STATUS" | "REVIEW_NEEDED" | "SYSTEM" | "REMINDER";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_date: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}