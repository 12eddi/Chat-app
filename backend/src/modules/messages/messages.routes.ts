import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireVerifiedEmail } from "../../middleware/verified.middleware";
import {
  cancelScheduledMessageController,
  createMessage,
  fetchMessages,
  reactToMessageController,
  removeMessage,
  updateScheduledMessage,
  updateMessage,
} from "./messages.controller";
import { upload } from "../../utils/upload";

const router = Router();

router.post(
  "/:chatId/messages",
  authenticate,
  requireVerifiedEmail,
  upload.single("image"),
  createMessage
);
router.get("/:chatId/messages", authenticate, requireVerifiedEmail, fetchMessages);
router.patch("/messages/:messageId", authenticate, requireVerifiedEmail, updateMessage);
router.patch(
  "/messages/:messageId/schedule",
  authenticate,
  requireVerifiedEmail,
  updateScheduledMessage
);
router.post(
  "/messages/:messageId/cancel-schedule",
  authenticate,
  requireVerifiedEmail,
  cancelScheduledMessageController
);
router.post(
  "/messages/:messageId/reactions",
  authenticate,
  requireVerifiedEmail,
  reactToMessageController
);
router.delete("/messages/:messageId", authenticate, requireVerifiedEmail, removeMessage);

export default router;
