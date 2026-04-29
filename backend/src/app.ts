import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import chatsRoutes from "./modules/chats/chats.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import { authenticate } from "./middleware/auth.middleware";


const app = express();

const allowedOriginPatterns = [/\.vercel\.app$/i];

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (env.clientUrls.includes(origin)) {
    return true;
  }

  return allowedOriginPatterns.some((pattern) => pattern.test(origin));
};

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/chats", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ message: "API is running" });
});

app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

export default app;
