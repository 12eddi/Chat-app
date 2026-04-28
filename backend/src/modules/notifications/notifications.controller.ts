import { Request, Response } from "express";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notifications.service";
import { isValidUuid } from "../../utils/validation";

export const fetchNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notifications = await getUserNotifications(userId);

    return res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to fetch notifications",
    });
  }
};

export const readNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const notificationIdParam = req.params.notificationId;
    const notificationId = Array.isArray(notificationIdParam)
      ? notificationIdParam[0]
      : notificationIdParam;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!notificationId || !isValidUuid(notificationId)) {
      return res.status(400).json({
        message: "Invalid notification id",
      });
    }

    const notification = await markNotificationAsRead(notificationId, userId);

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update notification",
    });
  }
};

export const readAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      message: "Notifications marked as read",
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update notifications",
    });
  }
};
