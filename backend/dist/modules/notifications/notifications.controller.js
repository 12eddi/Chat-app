"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAllNotifications = exports.readNotification = exports.fetchNotifications = void 0;
const notifications_service_1 = require("./notifications.service");
const validation_1 = require("../../utils/validation");
const fetchNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const notifications = await (0, notifications_service_1.getUserNotifications)(userId);
        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to fetch notifications",
        });
    }
};
exports.fetchNotifications = fetchNotifications;
const readNotification = async (req, res) => {
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
        if (!notificationId || !(0, validation_1.isValidUuid)(notificationId)) {
            return res.status(400).json({
                message: "Invalid notification id",
            });
        }
        const notification = await (0, notifications_service_1.markNotificationAsRead)(notificationId, userId);
        return res.status(200).json({
            message: "Notification marked as read",
            notification,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to update notification",
        });
    }
};
exports.readNotification = readNotification;
const readAllNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        await (0, notifications_service_1.markAllNotificationsAsRead)(userId);
        return res.status(200).json({
            message: "Notifications marked as read",
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to update notifications",
        });
    }
};
exports.readAllNotifications = readAllNotifications;
//# sourceMappingURL=notifications.controller.js.map