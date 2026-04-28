"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServer = exports.setSocketServer = void 0;
let io = null;
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
//# sourceMappingURL=socket.js.map