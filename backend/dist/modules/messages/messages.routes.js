"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const verified_middleware_1 = require("../../middleware/verified.middleware");
const messages_controller_1 = require("./messages.controller");
const upload_1 = require("../../utils/upload");
const router = (0, express_1.Router)();
router.post("/:chatId/messages", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, upload_1.upload.single("image"), messages_controller_1.createMessage);
router.get("/:chatId/messages", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.fetchMessages);
router.patch("/messages/:messageId", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.updateMessage);
router.patch("/messages/:messageId/schedule", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.updateScheduledMessage);
router.post("/messages/:messageId/cancel-schedule", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.cancelScheduledMessageController);
router.post("/messages/:messageId/reactions", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.reactToMessageController);
router.delete("/messages/:messageId", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, messages_controller_1.removeMessage);
exports.default = router;
//# sourceMappingURL=messages.routes.js.map