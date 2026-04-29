import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import {
  markMessageAsDelivered,
  markMessagesAsRead,
} from "./modules/messages/messages.service";
import {
  registerScheduledMessageProcessorShutdown,
  startScheduledMessageProcessor,
} from "./modules/messages/message-scheduler";
import { setSocketServer } from "./socket";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        env.clientUrls.includes(origin) ||
        /^https:\/\/chat-app(?:-[\w-]+)?(?:-12eddis-projects)?\.vercel\.app$/i.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  },
});

setSocketServer(io);

if (env.runScheduledMessageProcessor) {
  registerScheduledMessageProcessorShutdown();
  startScheduledMessageProcessor();
}

const onlineUsers = new Map<string, Set<string>>();
const presenceByUserId = new Map<string, "online" | "away">();

const emitOnlineUsers = () => {
  io.emit("online_users", Array.from(onlineUsers.keys()));
  io.emit("presence_snapshot", Object.fromEntries(presenceByUserId.entries()));
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_app", (userId: string) => {
    if (!userId) return;

    socket.data.userId = userId;
    socket.join(`user:${userId}`);

    const userSockets = onlineUsers.get(userId) ?? new Set<string>();
    userSockets.add(socket.id);
    onlineUsers.set(userId, userSockets);
    presenceByUserId.set(userId, "online");

    emitOnlineUsers();
  });

  socket.on("join_chat", (chatId: string) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("presence:update", ({ userId, status }: { userId: string; status: "online" | "away" }) => {
    if (!userId || !onlineUsers.has(userId)) {
      return;
    }

    const normalizedStatus = status === "away" ? "away" : "online";
    presenceByUserId.set(userId, normalizedStatus);
    emitOnlineUsers();
  });

  socket.on(
    "message_delivered",
    async ({
      messageId,
      recipientId,
    }: {
      messageId: string;
      chatId: string;
      recipientId: string;
    }) => {
      const deliveredMessage = await markMessageAsDelivered(messageId, recipientId);

      if (!deliveredMessage) return;

      io.to(`user:${deliveredMessage.senderId}`).emit("message_delivered", {
        messageId: deliveredMessage.id,
        chatId: deliveredMessage.chatId,
        recipientId,
      });
    }
  );

  socket.on(
    "messages_read",
    async ({
      chatId,
      readerId,
    }: {
      chatId: string;
      readerId: string;
    }) => {
      const readResult = await markMessagesAsRead(chatId, readerId);

      if (readResult.messageIds.length === 0) return;

      readResult.senderIds.forEach((senderId) => {
        io.to(`user:${senderId}`).emit("messages_read", {
          chatId,
          readerId,
          messageIds: readResult.messageIds,
        });
      });
    }
  );

  socket.on("typing", ({ chatId, userId, name }) => {
    socket.to(chatId).emit("typing", { chatId, userId, name });
  });

  socket.on("stop_typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("stop_typing", { chatId, userId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const userId = socket.data.userId as string | undefined;

    if (userId) {
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          presenceByUserId.delete(userId);
        } else {
          onlineUsers.set(userId, userSockets);
        }
      }
    }

    emitOnlineUsers();
  });
});

server.listen(env.port, env.host, () => {
  console.log(`Server running on ${env.host}:${env.port}`);
});
