import { Server } from "socket.io";
export declare const setSocketServer: (socketServer: Server) => void;
export declare const getSocketServer: () => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const trackSocketActiveChat: (socketId: string, userId: string, chatId: string) => void;
export declare const clearSocketActiveChat: (socketId: string) => void;
export declare const isUserActiveInChat: (userId: string, chatId: string) => boolean;
//# sourceMappingURL=socket.d.ts.map