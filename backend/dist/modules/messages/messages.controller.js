"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToMessageController = exports.cancelScheduledMessageController = exports.updateScheduledMessage = exports.removeMessage = exports.updateMessage = exports.fetchMessages = exports.createMessage = void 0;
const messages_service_1 = require("./messages.service");
const socket_1 = require("../../socket");
const validation_1 = require("../../utils/validation");
const notifications_service_1 = require("../notifications/notifications.service");
const cloudinary_1 = require("../../utils/cloudinary");
const buildImageUrl = async (file) => {
    if (!file) {
        return null;
    }
    const uploadedImage = await (0, cloudinary_1.uploadImageBuffer)(file, "chat-app/messages");
    return uploadedImage.secure_url;
};
const emitImmediateMessageDelivery = async (message, recipientIds) => {
    const io = (0, socket_1.getSocketServer)();
    await Promise.all(recipientIds.map(async (recipientId) => {
        io.to(`user:${recipientId}`).emit("receive_message", message);
        const previewBody = message.imageUrl
            ? message.content
                ? `${message.content} (image)`
                : "Sent an image"
            : message.content;
        const notification = await (0, notifications_service_1.createNotification)({
            userId: recipientId,
            type: "MESSAGE",
            title: `New message from ${message.sender.firstName}`,
            body: previewBody.length > 80 ? `${previewBody.slice(0, 77)}...` : previewBody,
            chatId: message.chatId,
            messageId: message.id,
        });
        io.to(`user:${recipientId}`).emit("notification:new", notification);
    }));
};
const createMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const chatIdParam = req.params.chatId;
        const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!chatId) {
            return res.status(400).json({ message: "Chat id is required" });
        }
        if (!(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        const uploadedImageFile = req.file || undefined;
        const imageUrl = await buildImageUrl(uploadedImageFile);
        const scheduledFor = (0, validation_1.parseScheduledFor)(req.body?.scheduledFor);
        const content = imageUrl
            ? (0, validation_1.validateOptionalMessageContent)(req.body?.content)
            : (0, validation_1.validateMessageContent)(req.body?.content);
        const { message, recipientIds, isScheduled } = await (0, messages_service_1.sendMessage)(chatId, userId, content, {
            imageUrl,
            scheduledFor,
        });
        if (!isScheduled) {
            await emitImmediateMessageDelivery(message, recipientIds);
        }
        return res.status(201).json({
            message: isScheduled ? "Message scheduled successfully" : "Message sent successfully",
            messageData: message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.createMessage = createMessage;
const fetchMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const chatIdParam = req.params.chatId;
        const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!chatId) {
            return res.status(400).json({ message: "Chat id is required" });
        }
        if (!(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        const rawLimit = req.query?.limit;
        const limit = typeof rawLimit === "string" && rawLimit.trim() ? Number(rawLimit) : undefined;
        const rawCursor = req.query?.cursor;
        const cursorId = typeof rawCursor === "string" && rawCursor.trim() ? rawCursor : null;
        const rawOnlyMedia = req.query?.onlyMedia;
        const onlyMedia = rawOnlyMedia === "true" || rawOnlyMedia === "1";
        const rawMarkRead = req.query?.markRead;
        const markRead = rawMarkRead === undefined ? true : rawMarkRead === "true" || rawMarkRead === "1";
        const readResult = markRead ? await (0, messages_service_1.markMessagesAsRead)(chatId, userId) : null;
        const pageOptions = { cursorId, onlyMedia };
        if (Number.isFinite(limit)) {
            pageOptions.limit = limit;
        }
        const page = await (0, messages_service_1.getMessagesPage)(chatId, userId, pageOptions);
        if (readResult && readResult.messageIds.length > 0) {
            const io = (0, socket_1.getSocketServer)();
            readResult.senderIds.forEach((senderId) => {
                io.to(`user:${senderId}`).emit("messages_read", {
                    chatId,
                    readerId: userId,
                    messageIds: readResult.messageIds,
                });
            });
        }
        return res.status(200).json({
            message: "Messages fetched successfully",
            messages: page.messages,
            hasMore: page.hasMore,
            nextCursor: page.nextCursor,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.fetchMessages = fetchMessages;
const updateMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const messageIdParam = req.params.messageId;
        const messageId = Array.isArray(messageIdParam)
            ? messageIdParam[0]
            : messageIdParam;
        const { content } = req.body || {};
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!messageId) {
            return res.status(400).json({ message: "Message id is required" });
        }
        if (!(0, validation_1.isValidUuid)(messageId)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        const trimmedContent = (0, validation_1.validateMessageContent)(content);
        const result = await (0, messages_service_1.editMessage)(messageId, userId, trimmedContent);
        const io = (0, socket_1.getSocketServer)();
        result.participantIds.forEach((participantId) => {
            io.to(`user:${participantId}`).emit("message_updated", result.message);
        });
        return res.status(200).json({
            message: "Message updated successfully",
            messageData: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.updateMessage = updateMessage;
const removeMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const messageIdParam = req.params.messageId;
        const messageId = Array.isArray(messageIdParam)
            ? messageIdParam[0]
            : messageIdParam;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!messageId) {
            return res.status(400).json({ message: "Message id is required" });
        }
        if (!(0, validation_1.isValidUuid)(messageId)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        const result = await (0, messages_service_1.deleteMessage)(messageId, userId);
        const io = (0, socket_1.getSocketServer)();
        result.participantIds.forEach((participantId) => {
            io.to(`user:${participantId}`).emit("message_deleted", result.message);
        });
        return res.status(200).json({
            message: "Message deleted successfully",
            messageData: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.removeMessage = removeMessage;
const updateScheduledMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const messageIdParam = req.params.messageId;
        const messageId = Array.isArray(messageIdParam)
            ? messageIdParam[0]
            : messageIdParam;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!messageId) {
            return res.status(400).json({ message: "Message id is required" });
        }
        if (!(0, validation_1.isValidUuid)(messageId)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        const scheduledFor = (0, validation_1.parseScheduledFor)(req.body?.scheduledFor);
        if (!scheduledFor) {
            return res.status(400).json({ message: "scheduledFor is required" });
        }
        const content = (0, validation_1.validateOptionalMessageContent)(req.body?.content);
        const result = await (0, messages_service_1.rescheduleMessage)(messageId, userId, content, scheduledFor);
        const io = (0, socket_1.getSocketServer)();
        result.participantIds.forEach((participantId) => {
            io.to(`user:${participantId}`).emit("message_updated", result.message);
        });
        return res.status(200).json({
            message: "Scheduled message updated successfully",
            messageData: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.updateScheduledMessage = updateScheduledMessage;
const cancelScheduledMessageController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const messageIdParam = req.params.messageId;
        const messageId = Array.isArray(messageIdParam)
            ? messageIdParam[0]
            : messageIdParam;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!messageId) {
            return res.status(400).json({ message: "Message id is required" });
        }
        if (!(0, validation_1.isValidUuid)(messageId)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        const result = await (0, messages_service_1.cancelScheduledMessage)(messageId, userId);
        const io = (0, socket_1.getSocketServer)();
        result.participantIds.forEach((participantId) => {
            io.to(`user:${participantId}`).emit("message_deleted", result.message);
        });
        return res.status(200).json({
            message: "Scheduled message canceled successfully",
            messageData: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.cancelScheduledMessageController = cancelScheduledMessageController;
const reactToMessageController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const messageIdParam = req.params.messageId;
        const messageId = Array.isArray(messageIdParam)
            ? messageIdParam[0]
            : messageIdParam;
        const emoji = req.body?.emoji;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!messageId) {
            return res.status(400).json({ message: "Message id is required" });
        }
        if (!(0, validation_1.isValidUuid)(messageId)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        if (typeof emoji !== "string") {
            return res.status(400).json({ message: "emoji is required" });
        }
        const result = await (0, messages_service_1.toggleMessageReaction)(messageId, userId, emoji);
        const io = (0, socket_1.getSocketServer)();
        result.participantIds.forEach((participantId) => {
            io.to(`user:${participantId}`).emit("message_updated", result.message);
        });
        return res.status(200).json({
            message: "Reaction updated successfully",
            messageData: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.reactToMessageController = reactToMessageController;
//# sourceMappingURL=messages.controller.js.map