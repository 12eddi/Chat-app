export declare const sendMessage: (chatId: string, senderId: string, content: string, options?: {
    imageUrl?: string | null;
    scheduledFor?: Date | null;
}) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    recipientIds: string[];
    isScheduled: boolean;
}>;
export declare const getMessages: (chatId: string, userId: string) => Promise<({
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        profilePhotoUrl: string | null;
    };
    reactions: ({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        messageId: string;
        emoji: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduledFor: Date | null;
    sentAt: Date | null;
    chatId: string;
    status: import("@prisma/client").$Enums.MessageStatus;
    senderId: string;
    content: string;
    imageUrl: string | null;
    deletedAt: Date | null;
})[]>;
export declare const getMessagesPage: (chatId: string, userId: string, options?: {
    limit?: number;
    cursorId?: string | null;
    onlyMedia?: boolean;
}) => Promise<{
    messages: ({
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    })[];
    hasMore: boolean;
    nextCursor: string | null;
}>;
export declare const editMessage: (messageId: string, userId: string, content: string) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    participantIds: string[];
}>;
export declare const deleteMessage: (messageId: string, userId: string) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    participantIds: string[];
}>;
export declare const rescheduleMessage: (messageId: string, userId: string, content: string, scheduledFor: Date) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    participantIds: string[];
}>;
export declare const cancelScheduledMessage: (messageId: string, userId: string) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    participantIds: string[];
}>;
export declare const toggleMessageReaction: (messageId: string, userId: string, emoji: string) => Promise<{
    message: {
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
        reactions: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePhotoUrl: string | null;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            messageId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        chatId: string;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderId: string;
        content: string;
        imageUrl: string | null;
        deletedAt: Date | null;
    };
    participantIds: string[];
}>;
export declare const markMessagesAsRead: (chatId: string, userId: string) => Promise<{
    messageIds: string[];
    senderIds: string[];
}>;
export declare const markMessageAsDelivered: (messageId: string, recipientId: string) => Promise<{
    id: string;
    chatId: string;
    senderId: string;
} | null>;
export declare const getDueScheduledMessages: (limit?: number) => Promise<({
    chat: {
        participants: {
            userId: string;
        }[];
    };
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        profilePhotoUrl: string | null;
    };
    reactions: ({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        messageId: string;
        emoji: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduledFor: Date | null;
    sentAt: Date | null;
    chatId: string;
    status: import("@prisma/client").$Enums.MessageStatus;
    senderId: string;
    content: string;
    imageUrl: string | null;
    deletedAt: Date | null;
})[]>;
export declare const markScheduledMessageAsSent: (messageId: string) => Promise<({
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        profilePhotoUrl: string | null;
    };
    reactions: ({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            profilePhotoUrl: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        messageId: string;
        emoji: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduledFor: Date | null;
    sentAt: Date | null;
    chatId: string;
    status: import("@prisma/client").$Enums.MessageStatus;
    senderId: string;
    content: string;
    imageUrl: string | null;
    deletedAt: Date | null;
}) | null>;
//# sourceMappingURL=messages.service.d.ts.map