import { Server } from "socket.io";

let io: Server | null = null;

export const setSocketServer = (socketServer: Server) => {
  io = socketServer;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket.IO server is not initialized");
  }

  return io;
};
