"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const chats_routes_1 = __importDefault(require("./modules/chats/chats.routes"));
const messages_routes_1 = __importDefault(require("./modules/messages/messages.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const app = (0, express_1.default)();
app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});
app.use((0, cors_1.default)({
    origin: env_1.env.clientUrl,
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/chats", chats_routes_1.default);
app.use("/api/chats", messages_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.get("/api/health", (_req, res) => {
    res.json({ message: "API is running" });
});
app.get("/api/protected", auth_middleware_1.authenticate, (req, res) => {
    res.json({
        message: "You accessed a protected route",
        user: req.user,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map