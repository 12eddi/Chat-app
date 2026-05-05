import { Server } from "socket.io";

let io: Server | null = null;
const activeChatBySocketId = new Map<string, { userId: string; chatId: string }>();
const activeChatCountsByUserId = new Map<string, Map<string, number>>();

export const setSocketServer = (socketServer: Server) => {
  io = socketServer;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket.IO server is not initialized");
  }

  return io;
};

const incrementActiveChat = (userId: string, chatId: string) => {
  const counts = activeChatCountsByUserId.get(userId) ?? new Map<string, number>();
  counts.set(chatId, (counts.get(chatId) ?? 0) + 1);
  activeChatCountsByUserId.set(userId, counts);
};

const decrementActiveChat = (userId: string, chatId: string) => {
  const counts = activeChatCountsByUserId.get(userId);

  if (!counts) {
    return;
  }

  const nextCount = (counts.get(chatId) ?? 0) - 1;

  if (nextCount > 0) {
    counts.set(chatId, nextCount);
  } else {
    counts.delete(chatId);
  }

  if (counts.size === 0) {
    activeChatCountsByUserId.delete(userId);
  }
};

export const trackSocketActiveChat = (
  socketId: string,
  userId: string,
  chatId: string
) => {
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

export const clearSocketActiveChat = (socketId: string) => {
  const current = activeChatBySocketId.get(socketId);

  if (!current) {
    return;
  }

  decrementActiveChat(current.userId, current.chatId);
  activeChatBySocketId.delete(socketId);
};

export const isUserActiveInChat = (userId: string, chatId: string) => {
  const counts = activeChatCountsByUserId.get(userId);
  return Boolean(counts?.get(chatId));
};
