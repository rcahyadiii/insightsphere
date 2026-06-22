/**
 * Notification Client — typed helpers untuk Notification API.
 *
 * Backend endpoints:
 *   GET   /notifications
 *   PATCH /notifications/{id}/read
 */
import { api, toQuery } from "@/app/lib/api";

export type NotificationCategory = "SYSTEM" | "INVENTORY" | "SALES" | "AI_INSIGHT";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NotificationRead {
  id: string;
  recipient_id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  is_read: boolean;
  action_link: string | null;
  meta_data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  total: number;
  unread_count: number;
  items: NotificationRead[];
}

export interface FetchNotificationsParams {
  is_read?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  skip?: number;
  limit?: number;
}

export const fetchNotifications = (
  params: FetchNotificationsParams = {},
): Promise<NotificationListResponse> =>
  api<NotificationListResponse>("/notifications", {
    query: toQuery(params as Record<string, unknown>),
  });

export const markNotificationRead = (id: string): Promise<NotificationRead> =>
  api<NotificationRead>(`/notifications/${id}/read`, { method: "PATCH" });
