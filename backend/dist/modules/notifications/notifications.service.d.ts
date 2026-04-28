type CreateNotificationInput = {
    userId: string;
    type: "MESSAGE" | "GROUP_INVITE" | "GROUP_EVENT";
    title: string;
    body: string;
    chatId?: string;
    messageId?: string;
};
export declare const createNotification: (input: CreateNotificationInput) => Promise<{
    message: {
        id: string;
        chatId: string;
        content: string;
    } | null;
    chat: {
        id: string;
        name: string | null;
        type: string;
    } | null;
} & {
    userId: string;
    id: string;
    createdAt: Date;
    type: import("@prisma/client").$Enums.NotificationType;
    chatId: string | null;
    title: string;
    body: string;
    isRead: boolean;
    messageId: string | null;
}>;
export declare const getUserNotifications: (userId: string) => Promise<({
    message: {
        id: string;
        chatId: string;
        content: string;
    } | null;
    chat: {
        id: string;
        name: string | null;
        type: string;
    } | null;
} & {
    userId: string;
    id: string;
    createdAt: Date;
    type: import("@prisma/client").$Enums.NotificationType;
    chatId: string | null;
    title: string;
    body: string;
    isRead: boolean;
    messageId: string | null;
})[]>;
export declare const markNotificationAsRead: (notificationId: string, userId: string) => Promise<{
    message: {
        id: string;
        chatId: string;
        content: string;
    } | null;
    chat: {
        id: string;
        name: string | null;
        type: string;
    } | null;
} & {
    userId: string;
    id: string;
    createdAt: Date;
    type: import("@prisma/client").$Enums.NotificationType;
    chatId: string | null;
    title: string;
    body: string;
    isRead: boolean;
    messageId: string | null;
}>;
export declare const markAllNotificationsAsRead: (userId: string) => Promise<void>;
export {};
//# sourceMappingURL=notifications.service.d.ts.map