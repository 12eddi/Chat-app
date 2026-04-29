"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const messages_service_1 = require("./modules/messages/messages.service");
const message_scheduler_1 = require("./modules/messages/message-scheduler");
const socket_1 = require("./socket");
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin ||
                env_1.env.clientUrls.includes(origin) ||
                /^https:\/\/chat-app(?:-[\w-]+)?(?:-12eddis-projects)?\.vercel\.app$/i.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    },
});
(0, socket_1.setSocketServer)(io);
if (env_1.env.runScheduledMessageProcessor) {
    (0, message_scheduler_1.registerScheduledMessageProcessorShutdown)();
    (0, message_scheduler_1.startScheduledMessageProcessor)();
}
const onlineUsers = new Map();
const presenceByUserId = new Map();
const emitOnlineUsers = () => {
    io.emit("online_users", Array.from(onlineUsers.keys()));
    io.emit("presence_snapshot", Object.fromEntries(presenceByUserId.entries()));
};
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_app", (userId) => {
        if (!userId)
            return;
        socket.data.userId = userId;
        socket.join(`user:${userId}`);
        const userSockets = onlineUsers.get(userId) ?? new Set();
        userSockets.add(socket.id);
        onlineUsers.set(userId, userSockets);
        presenceByUserId.set(userId, "online");
        emitOnlineUsers();
    });
    socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
    });
    socket.on("presence:update", ({ userId, status }) => {
        if (!userId || !onlineUsers.has(userId)) {
            return;
        }
        const normalizedStatus = status === "away" ? "away" : "online";
        presenceByUserId.set(userId, normalizedStatus);
        emitOnlineUsers();
    });
    socket.on("message_delivered", async ({ messageId, recipientId, }) => {
        const deliveredMessage = await (0, messages_service_1.markMessageAsDelivered)(messageId, recipientId);
        if (!deliveredMessage)
            return;
        io.to(`user:${deliveredMessage.senderId}`).emit("message_delivered", {
            messageId: deliveredMessage.id,
            chatId: deliveredMessage.chatId,
            recipientId,
        });
    });
    socket.on("messages_read", async ({ chatId, readerId, }) => {
        const readResult = await (0, messages_service_1.markMessagesAsRead)(chatId, readerId);
        if (readResult.messageIds.length === 0)
            return;
        readResult.senderIds.forEach((senderId) => {
            io.to(`user:${senderId}`).emit("messages_read", {
                chatId,
                readerId,
                messageIds: readResult.messageIds,
            });
        });
    });
    socket.on("typing", ({ chatId, userId, name }) => {
        socket.to(chatId).emit("typing", { chatId, userId, name });
    });
    socket.on("stop_typing", ({ chatId, userId }) => {
        socket.to(chatId).emit("stop_typing", { chatId, userId });
    });
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        const userId = socket.data.userId;
        if (userId) {
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    presenceByUserId.delete(userId);
                }
                else {
                    onlineUsers.set(userId, userSockets);
                }
            }
        }
        emitOnlineUsers();
    });
});
server.listen(env_1.env.port, env_1.env.host, () => {
    console.log(`Server running on ${env_1.env.host}:${env_1.env.port}`);
});
//# sourceMappingURL=server.js.map