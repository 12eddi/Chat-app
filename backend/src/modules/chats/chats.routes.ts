import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireVerifiedEmail } from "../../middleware/verified.middleware";
import {
  acceptInvite,
  addParticipants,
  changeParticipantRole,
  createDirectChat,
  createGroup,
  fetchChats,
  fetchInvites,
  leaveGroupController,
  rejectInvite,
  removeParticipant,
  updateGroupDetailsController,
} from "./chats.controller";
import { upload } from "../../utils/upload";

const router = Router();

router.post("/direct", authenticate, requireVerifiedEmail, createDirectChat);
router.post("/group", authenticate, requireVerifiedEmail, createGroup);
router.get("/invites", authenticate, requireVerifiedEmail, fetchInvites);
router.post("/invites/:inviteId/accept", authenticate, requireVerifiedEmail, acceptInvite);
router.post("/invites/:inviteId/reject", authenticate, requireVerifiedEmail, rejectInvite);
router.post(
  "/:chatId/participants",
  authenticate,
  requireVerifiedEmail,
  addParticipants
);
router.patch(
  "/:chatId",
  authenticate,
  requireVerifiedEmail,
  upload.single("photo"),
  updateGroupDetailsController
);
router.patch(
  "/:chatId/participants/:participantId/role",
  authenticate,
  requireVerifiedEmail,
  changeParticipantRole
);
router.delete(
  "/:chatId/participants/:participantId",
  authenticate,
  requireVerifiedEmail,
  removeParticipant
);
router.post("/:chatId/leave", authenticate, requireVerifiedEmail, leaveGroupController);
router.get("/", authenticate, requireVerifiedEmail, fetchChats);

export default router;
