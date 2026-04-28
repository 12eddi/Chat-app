import api from "./axios";
import type { AppNotification } from "../types/notification";

export const getNotificationsRequest = async () => {
  const { data } = await api.get<{ message: string; notifications: AppNotification[] }>(
    "/notifications"
  );
  return data;
};

export const markNotificationReadRequest = async (notificationId: string) => {
  const { data } = await api.patch<{ message: string; notification: AppNotification }>(
    `/notifications/${notificationId}/read`
  );
  return data;
};

export const markAllNotificationsReadRequest = async () => {
  const { data } = await api.patch<{ message: string }>("/notifications/read-all");
  return data;
};
