import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireVerifiedEmail } from "../../middleware/verified.middleware";
import {
  fetchNotifications,
  readAllNotifications,
  readNotification,
} from "./notifications.controller";

const router = Router();

router.get("/", authenticate, requireVerifiedEmail, fetchNotifications);
router.patch("/read-all", authenticate, requireVerifiedEmail, readAllNotifications);
router.patch("/:notificationId/read", authenticate, requireVerifiedEmail, readNotification);

export default router;
