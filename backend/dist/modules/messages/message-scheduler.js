"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScheduledMessageProcessorShutdown = exports.stopScheduledMessageProcessor = exports.startScheduledMessageProcessor = exports.processScheduledMessages = void 0;
const env_1 = require("../../config/env");
const socket_1 = require("../../socket");
const notifications_service_1 = require("../notifications/notifications.service");
const messages_service_1 = require("./messages.service");
let schedulerTimer = null;
let isProcessingScheduledMessages = false;
let isStopping = false;
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
const processScheduledMessages = async () => {
    if (isProcessingScheduledMessages || isStopping) {
        return 0;
    }
    isProcessingScheduledMessages = true;
    try {
        let processedCount = 0;
        const batchSize = env_1.env.scheduledMessageBatchSize;
        while (true) {
            const dueMessages = await (0, messages_service_1.getDueScheduledMessages)(batchSize);
            if (dueMessages.length === 0) {
                break;
            }
            for (const dueMessage of dueMessages) {
                const sentMessage = await (0, messages_service_1.markScheduledMessageAsSent)(dueMessage.id);
                if (!sentMessage) {
                    continue;
                }
                const recipientIds = dueMessage.chat.participants
                    .map((participant) => participant.userId)
                    .filter((participantId) => participantId !== dueMessage.senderId);
                await emitImmediateMessageDelivery(sentMessage, recipientIds);
                processedCount += 1;
            }
            if (dueMessages.length < batchSize) {
                break;
            }
        }
        return processedCount;
    }
    finally {
        isProcessingScheduledMessages = false;
    }
};
exports.processScheduledMessages = processScheduledMessages;
const scheduleNextRun = (delayMs) => {
    if (isStopping) {
        return;
    }
    schedulerTimer = setTimeout(() => {
        void runProcessorLoop();
    }, delayMs);
};
const runProcessorLoop = async () => {
    if (isStopping) {
        return;
    }
    try {
        const processedCount = await (0, exports.processScheduledMessages)();
        scheduleNextRun(processedCount >= env_1.env.scheduledMessageBatchSize ? 250 : env_1.env.scheduledMessagePollMs);
    }
    catch (error) {
        console.error("Failed to process scheduled messages:", error);
        scheduleNextRun(env_1.env.scheduledMessageErrorBackoffMs);
    }
};
const startScheduledMessageProcessor = () => {
    if (schedulerTimer) {
        return;
    }
    isStopping = false;
    void runProcessorLoop();
};
exports.startScheduledMessageProcessor = startScheduledMessageProcessor;
const stopScheduledMessageProcessor = () => {
    isStopping = true;
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
};
exports.stopScheduledMessageProcessor = stopScheduledMessageProcessor;
const registerScheduledMessageProcessorShutdown = () => {
    const shutdown = () => {
        (0, exports.stopScheduledMessageProcessor)();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
};
exports.registerScheduledMessageProcessorShutdown = registerScheduledMessageProcessorShutdown;
//# sourceMappingURL=message-scheduler.js.map