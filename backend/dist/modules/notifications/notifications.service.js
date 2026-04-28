"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = exports.createNotification = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const notificationInclude = {
    chat: {
        select: {
            id: true,
            type: true,
            name: true,
        },
    },
    message: {
        select: {
            id: true,
            content: true,
            chatId: true,
        },
    },
};
const createNotification = async (input) => {
    return prisma_1.default.notification.create({
        data: input,
        include: notificationInclude,
    });
};
exports.createNotification = createNotification;
const getUserNotifications = async (userId) => {
    return prisma_1.default.notification.findMany({
        where: {
            userId,
        },
        include: notificationInclude,
        orderBy: {
            createdAt: "desc",
        },
        take: 50,
    });
};
exports.getUserNotifications = getUserNotifications;
const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await prisma_1.default.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
    });
    if (!notification) {
        throw new Error("Notification not found");
    }
    return prisma_1.default.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            isRead: true,
        },
        include: notificationInclude,
    });
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (userId) => {
    await prisma_1.default.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
//# sourceMappingURL=notifications.service.js.map