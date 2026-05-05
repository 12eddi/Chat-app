"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserActiveInChat = exports.clearSocketActiveChat = exports.trackSocketActiveChat = exports.getSocketServer = exports.setSocketServer = void 0;
let io = null;
const activeChatBySocketId = new Map();
const activeChatCountsByUserId = new Map();
const setSocketServer = (socketServer) => {
    io = socketServer;
};
exports.setSocketServer = setSocketServer;
const getSocketServer = () => {
    if (!io) {
        throw new Error("Socket.IO server is not initialized");
    }
    return io;
};
exports.getSocketServer = getSocketServer;
const incrementActiveChat = (userId, chatId) => {
    const counts = activeChatCountsByUserId.get(userId) ?? new Map();
    counts.set(chatId, (counts.get(chatId) ?? 0) + 1);
    activeChatCountsByUserId.set(userId, counts);
};
const decrementActiveChat = (userId, chatId) => {
    const counts = activeChatCountsByUserId.get(userId);
    if (!counts) {
        return;
    }
    const nextCount = (counts.get(chatId) ?? 0) - 1;
    if (nextCount > 0) {
        counts.set(chatId, nextCount);
    }
    else {
        counts.delete(chatId);
    }
    if (counts.size === 0) {
        activeChatCountsByUserId.delete(userId);
    }
};
const trackSocketActiveChat = (socketId, userId, chatId) => {
    const previous = activeChatBySocketId.get(socketId);
    if (previous && previous.userId === userId && previous.chatId === chatId) {
        return;
    }
    if (previous) {
        decrementActiveChat(previous.userId, previous.chatId);
    }
    activeChatBySocketId.set(socketId, { userId, chatId });
    incrementActiveChat(userId, chatId);
};
exports.trackSocketActiveChat = trackSocketActiveChat;
const clearSocketActiveChat = (socketId) => {
    const current = activeChatBySocketId.get(socketId);
    if (!current) {
        return;
    }
    decrementActiveChat(current.userId, current.chatId);
    activeChatBySocketId.delete(socketId);
};
exports.clearSocketActiveChat = clearSocketActiveChat;
const isUserActiveInChat = (userId, chatId) => {
    const counts = activeChatCountsByUserId.get(userId);
    return Boolean(counts?.get(chatId));
};
exports.isUserActiveInChat = isUserActiveInChat;
//# sourceMappingURL=socket.js.map