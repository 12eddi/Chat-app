import { Request, Response } from "express";
import {
  acceptGroupInvite,
  createGroupChat,
  getOrCreateDirectChat,
  getPendingGroupInvites,
  getUserChats,
  inviteGroupParticipants,
  leaveGroup,
  rejectGroupInvite,
  removeGroupMember,
  updateGroupDetails,
  updateParticipantRole,
} from "./chats.service";
import { getSocketServer } from "../../socket";
import { isValidUuid } from "../../utils/validation";
import { createNotification } from "../notifications/notifications.service";

const emitChatUpdate = (chat: {
  id: string;
  participants: Array<{ userId: string }>;
}) => {
  const io = getSocketServer();
  chat.participants.forEach((participant) => {
    io.to(`user:${participant.userId}`).emit("chat:updated", chat);
  });
};

export const createDirectChat = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: "Target userId is required" });
    }

    const chat = await getOrCreateDirectChat(req.user.id, userId);
    emitChatUpdate(chat);

    return res.status(200).json({
      message: "Chat fetched/created successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

const buildChatPhotoUrl = (file?: { filename: string } | null) => {
  if (!file) {
    return undefined;
  }

  return `/uploads/${file.filename}`;
};

export const fetchChats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await getUserChats(req.user.id);

    return res.status(200).json({
      message: "Chats fetched successfully",
      chats,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export const fetchInvites = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invites = await getPendingGroupInvites(req.user.id);

    return res.status(200).json({
      message: "Group invites fetched successfully",
      invites,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to fetch invites",
    });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, userIds } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        message: "Group name must be at least 2 characters",
      });
    }

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const chat = await createGroupChat(req.user.id, name.trim(), userIds);
    const io = getSocketServer();
    const owner = chat.participants.find((participant) => participant.userId === req.user?.id)?.user;
    const chatName = chat.name || "a group";

    await Promise.all(
      chat.invites.map(async (invite) => {
        const notification = await createNotification({
          userId: invite.userId,
          type: "GROUP_INVITE",
          title: "Group invitation",
          body: `${owner?.firstName || "Someone"} invited you to join ${chatName}.`,
          chatId: chat.id,
        });

        io.to(`user:${invite.userId}`).emit("notification:new", notification);
        io.to(`user:${invite.userId}`).emit("group_invites:updated");
      })
    );

    emitChatUpdate(chat);

    return res.status(201).json({
      message: "Group chat created successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to create group chat",
    });
  }
};

export const addParticipants = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const { userIds } = req.body || {};

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const chat = await inviteGroupParticipants(chatId, currentUserId, userIds);
    const io = getSocketServer();
    const inviter = chat.participants.find((participant) => participant.userId === currentUserId)?.user;
    const chatName = chat.name || "a group";

    await Promise.all(
      chat.invites
        .filter((invite) => userIds.includes(invite.userId))
        .map(async (invite) => {
          const notification = await createNotification({
            userId: invite.userId,
            type: "GROUP_INVITE",
            title: "Group invitation",
            body: `${inviter?.firstName || "Someone"} invited you to join ${chatName}.`,
            chatId: chat.id,
          });

          io.to(`user:${invite.userId}`).emit("notification:new", notification);
          io.to(`user:${invite.userId}`).emit("group_invites:updated");
        })
    );

    emitChatUpdate(chat);

    return res.status(200).json({
      message: "Invitations sent successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to add participants",
    });
  }
};

export const updateGroupDetailsController = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const rawName = req.body?.name;
    const name = typeof rawName === "string" ? rawName : undefined;
    const photoUrl = buildChatPhotoUrl(req.file || undefined);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const chat = await updateGroupDetails(chatId, currentUserId, {
      ...(name !== undefined ? { name } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    });

    emitChatUpdate(chat);

    return res.status(200).json({
      message: "Group updated successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update group",
    });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const inviteIdParam = req.params.inviteId;
    const inviteId = Array.isArray(inviteIdParam) ? inviteIdParam[0] : inviteIdParam;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!inviteId || !isValidUuid(inviteId)) {
      return res.status(400).json({ message: "Invalid invite id" });
    }

    const chat = await acceptGroupInvite(inviteId, currentUserId);
    const io = getSocketServer();

    emitChatUpdate(chat);
    io.to(`user:${currentUserId}`).emit("group_invites:updated");

    return res.status(200).json({
      message: "Invite accepted",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to accept invite",
    });
  }
};

export const rejectInvite = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const inviteIdParam = req.params.inviteId;
    const inviteId = Array.isArray(inviteIdParam) ? inviteIdParam[0] : inviteIdParam;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!inviteId || !isValidUuid(inviteId)) {
      return res.status(400).json({ message: "Invalid invite id" });
    }

    await rejectGroupInvite(inviteId, currentUserId);
    getSocketServer().to(`user:${currentUserId}`).emit("group_invites:updated");

    return res.status(200).json({
      message: "Invite rejected",
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to reject invite",
    });
  }
};

export const changeParticipantRole = async (req: Request, res: Response) => {
  try {
    const actorUserId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const participantIdParam = req.params.participantId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const participantId = Array.isArray(participantIdParam)
      ? participantIdParam[0]
      : participantIdParam;
    const role = req.body?.role;

    if (!actorUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    if (!participantId || !isValidUuid(participantId)) {
      return res.status(400).json({ message: "Invalid participant id" });
    }

    if (role !== "MEMBER" && role !== "ADMIN") {
      return res.status(400).json({ message: "Role must be MEMBER or ADMIN" });
    }

    const chat = await updateParticipantRole(chatId, actorUserId, participantId, role);
    emitChatUpdate(chat);

    return res.status(200).json({
      message: "Participant role updated",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update participant role",
    });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const actorUserId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const participantIdParam = req.params.participantId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const participantId = Array.isArray(participantIdParam)
      ? participantIdParam[0]
      : participantIdParam;

    if (!actorUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    if (!participantId || !isValidUuid(participantId)) {
      return res.status(400).json({ message: "Invalid participant id" });
    }

    const chat = await removeGroupMember(chatId, actorUserId, participantId);
    emitChatUpdate(chat);

    return res.status(200).json({
      message: "Participant removed",
      chat,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to remove participant",
    });
  }
};

export const leaveGroupController = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const chat = await leaveGroup(chatId, currentUserId);

    if (chat) {
      emitChatUpdate(chat);
    }

    getSocketServer().to(`user:${currentUserId}`).emit("chat:left", { chatId });

    return res.status(200).json({
      message: "Left group successfully",
      chat: chat || null,
      chatId,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to leave group",
    });
  }
};
