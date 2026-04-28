"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const verified_middleware_1 = require("../../middleware/verified.middleware");
const notifications_controller_1 = require("./notifications.controller");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, notifications_controller_1.fetchNotifications);
router.patch("/read-all", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, notifications_controller_1.readAllNotifications);
router.patch("/:notificationId/read", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, notifications_controller_1.readNotification);
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map