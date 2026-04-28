"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markScheduledMessageAsSent = exports.getDueScheduledMessages = exports.markMessageAsDelivered = exports.markMessagesAsRead = exports.toggleMessageReaction = exports.cancelScheduledMessage = exports.rescheduleMessage = exports.deleteMessage = exports.editMessage = exports.getMessagesPage = exports.getMessages = exports.sendMessage = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const validation_1 = require("../../utils/validation");
const messageInclude = {
    sender: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profilePhotoUrl: true,
        },
    },
    reactions: {
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePhotoUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    },
};
const getMessageParticipantIds = (participants) => participants.map((participant) => participant.userId);
const getChatForMember = async (chatId, userId) => {
    const chat = await prisma_1.default.chat.findFirst({
        where: {
            id: chatId,
            participants: {
                some: {
                    userId,
                },
            },
        },
        select: {
            id: true,
            type: true,
            participants: {
                select: {
                    userId: true,
                },
            },
        },
    });
    if (!chat) {
        throw new Error("Chat not found or access denied");
    }
    return chat;
};
const sendMessage = async (chatId, senderId, content, options) => {
    const trimmedContent = content.trim();
    const normalizedImageUrl = options?.imageUrl || null;
    if (!trimmedContent && !normalizedImageUrl) {
        throw new Error("Message content or image is required");
    }
    if (trimmedContent.length > validation_1.MESSAGE_MAX_LENGTH) {
        throw new Error(`Message must be ${validation_1.MESSAGE_MAX_LENGTH} characters or less`);
    }
    const chat = await getChatForMember(chatId, senderId);
    const scheduledFor = options?.scheduledFor ?? null;
    const sendImmediately = !scheduledFor || scheduledFor <= new Date();
    const message = await prisma_1.default.$transaction(async (tx) => {
        const createdMessage = await tx.message.create({
            data: {
                chatId,
                senderId,
                content: trimmedContent,
                imageUrl: normalizedImageUrl,
                scheduledFor,
                sentAt: sendImmediately ? new Date() : null,
                status: "SENT",
            },
            include: messageInclude,
        });
        await tx.chat.update({
            where: { id: chatId },
            data: {
                updatedAt: new Date(),
            },
        });
        return createdMessage;
    });
    return {
        message,
        recipientIds: sendImmediately
            ? chat.participants
                .map((participant) => participant.userId)
                .filter((participantId) => participantId !== senderId)
            : [],
        isScheduled: !sendImmediately,
    };
};
exports.sendMessage = sendMessage;
const getMessages = async (chatId, userId) => {
    await getChatForMember(chatId, userId);
    return prisma_1.default.message.findMany({
        where: {
            chatId,
            deletedAt: null,
            OR: [
                {
                    sentAt: {
                        not: null,
                    },
                },
                {
                    senderId: userId,
                    sentAt: null,
                },
            ],
        },
        include: messageInclude,
        orderBy: {
            createdAt: "asc",
        },
    });
};
exports.getMessages = getMessages;
const getMessagesPage = async (chatId, userId, options) => {
    await getChatForMember(chatId, userId);
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const cursorId = options?.cursorId ?? null;
    const onlyMedia = options?.onlyMedia ?? false;
    const items = await prisma_1.default.message.findMany({
        where: {
            chatId,
            deletedAt: null,
            ...(onlyMedia
                ? {
                    imageUrl: {
                        not: null,
                    },
                }
                : {}),
            OR: [
                {
                    sentAt: {
                        not: null,
                    },
                },
                {
                    senderId: userId,
                    sentAt: null,
                },
            ],
        },
        include: messageInclude,
        orderBy: {
            createdAt: "desc",
        },
        ...(cursorId
            ? {
                cursor: { id: cursorId },
                skip: 1,
            }
            : {}),
        take: limit + 1,
    });
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    const messages = pageItems.reverse(); // return asc so the UI can just render top->bottom
    const nextCursor = hasMore ? messages[0]?.id ?? null : null;
    return {
        messages,
        hasMore,
        nextCursor,
    };
};
exports.getMessagesPage = getMessagesPage;
const getOwnedMessageForUpdate = async (messageId, userId) => {
    const message = await prisma_1.default.message.findFirst({
        where: {
            id: messageId,
            senderId: userId,
            deletedAt: null,
            chat: {
                participants: {
                    some: {
                        userId,
                    },
                },
            },
        },
        select: {
            id: true,
            chatId: true,
            senderId: true,
            content: true,
            imageUrl: true,
            scheduledFor: true,
            sentAt: true,
            chat: {
                select: {
                    participants: {
                        select: {
                            userId: true,
                        },
                    },
                },
            },
        },
    });
    if (!message) {
        throw new Error("Message not found or access denied");
    }
    return message;
};
const getScheduledMessageForSender = async (messageId, userId) => {
    const message = await getOwnedMessageForUpdate(messageId, userId);
    if (!message.scheduledFor || message.sentAt) {
        throw new Error("Only pending scheduled messages can be updated");
    }
    return message;
};
const editMessage = async (messageId, userId, content) => {
    if (content.length > validation_1.MESSAGE_MAX_LENGTH) {
        throw new Error(`Message must be ${validation_1.MESSAGE_MAX_LENGTH} characters or less`);
    }
    const messageToUpdate = await getOwnedMessageForUpdate(messageId, userId);
    const updatedMessage = await prisma_1.default.$transaction(async (tx) => {
        const message = await tx.message.update({
            where: {
                id: messageId,
            },
            data: {
                content,
            },
            include: messageInclude,
        });
        await tx.chat.update({
            where: { id: message.chatId },
            data: {
                updatedAt: new Date(),
            },
        });
        return message;
    });
    return {
        message: updatedMessage,
        participantIds: messageToUpdate.sentAt || !updatedMessage.scheduledFor
            ? messageToUpdate.chat.participants.map((participant) => participant.userId)
            : [userId],
    };
};
exports.editMessage = editMessage;
const deleteMessage = async (messageId, userId) => {
    const messageToDelete = await getOwnedMessageForUpdate(messageId, userId);
    const deletedMessage = await prisma_1.default.$transaction(async (tx) => {
        const message = await tx.message.update({
            where: {
                id: messageId,
            },
            data: {
                deletedAt: new Date(),
            },
            include: messageInclude,
        });
        await tx.chat.update({
            where: { id: message.chatId },
            data: {
                updatedAt: new Date(),
            },
        });
        return message;
    });
    return {
        message: deletedMessage,
        participantIds: messageToDelete.sentAt || !deletedMessage.scheduledFor
            ? messageToDelete.chat.participants.map((participant) => participant.userId)
            : [userId],
    };
};
exports.deleteMessage = deleteMessage;
const rescheduleMessage = async (messageId, userId, content, scheduledFor) => {
    if (content.length > validation_1.MESSAGE_MAX_LENGTH) {
        throw new Error(`Message must be ${validation_1.MESSAGE_MAX_LENGTH} characters or less`);
    }
    const scheduledMessage = await getScheduledMessageForSender(messageId, userId);
    if (!content.trim() && !scheduledMessage.imageUrl) {
        throw new Error("Message content or image is required");
    }
    const message = await prisma_1.default.$transaction(async (tx) => {
        const updatedMessage = await tx.message.update({
            where: {
                id: messageId,
            },
            data: {
                content: content.trim(),
                scheduledFor,
            },
            include: messageInclude,
        });
        await tx.chat.update({
            where: {
                id: scheduledMessage.chatId,
            },
            data: {
                updatedAt: new Date(),
            },
        });
        return updatedMessage;
    });
    return {
        message,
        participantIds: [userId],
    };
};
exports.rescheduleMessage = rescheduleMessage;
const cancelScheduledMessage = async (messageId, userId) => {
    const scheduledMessage = await getScheduledMessageForSender(messageId, userId);
    const cancelledMessage = await prisma_1.default.$transaction(async (tx) => {
        const message = await tx.message.update({
            where: {
                id: messageId,
            },
            data: {
                deletedAt: new Date(),
            },
            include: messageInclude,
        });
        await tx.chat.update({
            where: {
                id: scheduledMessage.chatId,
            },
            data: {
                updatedAt: new Date(),
            },
        });
        return message;
    });
    return {
        message: cancelledMessage,
        participantIds: [userId],
    };
};
exports.cancelScheduledMessage = cancelScheduledMessage;
const toggleMessageReaction = async (messageId, userId, emoji) => {
    const trimmedEmoji = emoji.trim();
    if (!trimmedEmoji || trimmedEmoji.length > 16) {
        throw new Error("Reaction emoji is invalid");
    }
    const message = await prisma_1.default.message.findFirst({
        where: {
            id: messageId,
            deletedAt: null,
            chat: {
                participants: {
                    some: {
                        userId,
                    },
                },
            },
        },
        select: {
            id: true,
            chatId: true,
            chat: {
                select: {
                    participants: {
                        select: {
                            userId: true,
                        },
                    },
                },
            },
        },
    });
    if (!message) {
        throw new Error("Message not found or access denied");
    }
    const existingReaction = await prisma_1.default.messageReaction.findUnique({
        where: {
            messageId_userId_emoji: {
                messageId,
                userId,
                emoji: trimmedEmoji,
            },
        },
        select: {
            id: true,
        },
    });
    if (existingReaction) {
        await prisma_1.default.messageReaction.delete({
            where: {
                id: existingReaction.id,
            },
        });
    }
    else {
        await prisma_1.default.messageReaction.create({
            data: {
                messageId,
                userId,
                emoji: trimmedEmoji,
            },
        });
    }
    const updatedMessage = await prisma_1.default.message.findUnique({
        where: {
            id: messageId,
        },
        include: messageInclude,
    });
    if (!updatedMessage) {
        throw new Error("Message not found after reaction update");
    }
    return {
        message: updatedMessage,
        participantIds: getMessageParticipantIds(message.chat.participants),
    };
};
exports.toggleMessageReaction = toggleMessageReaction;
const markMessagesAsRead = async (chatId, userId) => {
    await getChatForMember(chatId, userId);
    const unreadMessages = await prisma_1.default.message.findMany({
        where: {
            chatId,
            senderId: { not: userId },
            sentAt: {
                not: null,
            },
            status: { not: "READ" },
        },
        select: {
            id: true,
            senderId: true,
        },
    });
    if (unreadMessages.length === 0) {
        return {
            messageIds: [],
            senderIds: [],
        };
    }
    await prisma_1.default.message.updateMany({
        where: {
            id: {
                in: unreadMessages.map((message) => message.id),
            },
        },
        data: {
            status: "READ",
        },
    });
    return {
        messageIds: unreadMessages.map((message) => message.id),
        senderIds: [...new Set(unreadMessages.map((message) => message.senderId))],
    };
};
exports.markMessagesAsRead = markMessagesAsRead;
const markMessageAsDelivered = async (messageId, recipientId) => {
    const message = await prisma_1.default.message.findFirst({
        where: {
            id: messageId,
            sentAt: {
                not: null,
            },
            chat: {
                participants: {
                    some: {
                        userId: recipientId,
                    },
                },
            },
            senderId: { not: recipientId },
            status: "SENT",
        },
        select: {
            id: true,
            senderId: true,
            chatId: true,
        },
    });
    if (!message) {
        return null;
    }
    await prisma_1.default.message.update({
        where: {
            id: message.id,
        },
        data: {
            status: "DELIVERED",
        },
    });
    return message;
};
exports.markMessageAsDelivered = markMessageAsDelivered;
const getDueScheduledMessages = async (limit = 20) => {
    return prisma_1.default.message.findMany({
        where: {
            deletedAt: null,
            scheduledFor: {
                lte: new Date(),
            },
            sentAt: null,
        },
        include: {
            ...messageInclude,
            chat: {
                select: {
                    participants: {
                        select: {
                            userId: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            scheduledFor: "asc",
        },
        take: limit,
    });
};
exports.getDueScheduledMessages = getDueScheduledMessages;
const markScheduledMessageAsSent = async (messageId) => {
    const sentAt = new Date();
    const claimResult = await prisma_1.default.message.updateMany({
        where: {
            id: messageId,
            deletedAt: null,
            sentAt: null,
        },
        data: {
            sentAt,
            status: "SENT",
        },
    });
    if (claimResult.count === 0) {
        return null;
    }
    const message = await prisma_1.default.message.findUnique({
        where: {
            id: messageId,
        },
        include: messageInclude,
    });
    if (!message) {
        return null;
    }
    await prisma_1.default.chat.update({
        where: {
            id: message.chatId,
        },
        data: {
            updatedAt: sentAt,
        },
    });
    return message;
};
exports.markScheduledMessageAsSent = markScheduledMessageAsSent;
//# sourceMappingURL=messages.service.js.map