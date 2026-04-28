"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveGroupController = exports.removeParticipant = exports.changeParticipantRole = exports.rejectInvite = exports.acceptInvite = exports.updateGroupDetailsController = exports.addParticipants = exports.createGroup = exports.fetchInvites = exports.fetchChats = exports.createDirectChat = void 0;
const chats_service_1 = require("./chats.service");
const socket_1 = require("../../socket");
const validation_1 = require("../../utils/validation");
const notifications_service_1 = require("../notifications/notifications.service");
const emitChatUpdate = (chat) => {
    const io = (0, socket_1.getSocketServer)();
    chat.participants.forEach((participant) => {
        io.to(`user:${participant.userId}`).emit("chat:updated", chat);
    });
};
const createDirectChat = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { userId } = req.body || {};
        if (!userId) {
            return res.status(400).json({ message: "Target userId is required" });
        }
        const chat = await (0, chats_service_1.getOrCreateDirectChat)(req.user.id, userId);
        emitChatUpdate(chat);
        return res.status(200).json({
            message: "Chat fetched/created successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Something went wrong",
        });
    }
};
exports.createDirectChat = createDirectChat;
const buildChatPhotoUrl = (file) => {
    if (!file) {
        return undefined;
    }
    return `/uploads/${file.filename}`;
};
const fetchChats = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const chats = await (0, chats_service_1.getUserChats)(req.user.id);
        return res.status(200).json({
            message: "Chats fetched successfully",
            chats,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Something went wrong",
        });
    }
};
exports.fetchChats = fetchChats;
const fetchInvites = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const invites = await (0, chats_service_1.getPendingGroupInvites)(req.user.id);
        return res.status(200).json({
            message: "Group invites fetched successfully",
            invites,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to fetch invites",
        });
    }
};
exports.fetchInvites = fetchInvites;
const createGroup = async (req, res) => {
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
        const chat = await (0, chats_service_1.createGroupChat)(req.user.id, name.trim(), userIds);
        const io = (0, socket_1.getSocketServer)();
        const owner = chat.participants.find((participant) => participant.userId === req.user?.id)?.user;
        const chatName = chat.name || "a group";
        await Promise.all(chat.invites.map(async (invite) => {
            const notification = await (0, notifications_service_1.createNotification)({
                userId: invite.userId,
                type: "GROUP_INVITE",
                title: "Group invitation",
                body: `${owner?.firstName || "Someone"} invited you to join ${chatName}.`,
                chatId: chat.id,
            });
            io.to(`user:${invite.userId}`).emit("notification:new", notification);
            io.to(`user:${invite.userId}`).emit("group_invites:updated");
        }));
        emitChatUpdate(chat);
        return res.status(201).json({
            message: "Group chat created successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to create group chat",
        });
    }
};
exports.createGroup = createGroup;
const addParticipants = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const chatIdParam = req.params.chatId;
        const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
        const { userIds } = req.body || {};
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!chatId || !(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        if (!Array.isArray(userIds)) {
            return res.status(400).json({ message: "userIds must be an array" });
        }
        const chat = await (0, chats_service_1.inviteGroupParticipants)(chatId, currentUserId, userIds);
        const io = (0, socket_1.getSocketServer)();
        const inviter = chat.participants.find((participant) => participant.userId === currentUserId)?.user;
        const chatName = chat.name || "a group";
        await Promise.all(chat.invites
            .filter((invite) => userIds.includes(invite.userId))
            .map(async (invite) => {
            const notification = await (0, notifications_service_1.createNotification)({
                userId: invite.userId,
                type: "GROUP_INVITE",
                title: "Group invitation",
                body: `${inviter?.firstName || "Someone"} invited you to join ${chatName}.`,
                chatId: chat.id,
            });
            io.to(`user:${invite.userId}`).emit("notification:new", notification);
            io.to(`user:${invite.userId}`).emit("group_invites:updated");
        }));
        emitChatUpdate(chat);
        return res.status(200).json({
            message: "Invitations sent successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to add participants",
        });
    }
};
exports.addParticipants = addParticipants;
const updateGroupDetailsController = async (req, res) => {
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
        if (!chatId || !(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        const chat = await (0, chats_service_1.updateGroupDetails)(chatId, currentUserId, {
            ...(name !== undefined ? { name } : {}),
            ...(photoUrl !== undefined ? { photoUrl } : {}),
        });
        emitChatUpdate(chat);
        return res.status(200).json({
            message: "Group updated successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to update group",
        });
    }
};
exports.updateGroupDetailsController = updateGroupDetailsController;
const acceptInvite = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const inviteIdParam = req.params.inviteId;
        const inviteId = Array.isArray(inviteIdParam) ? inviteIdParam[0] : inviteIdParam;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!inviteId || !(0, validation_1.isValidUuid)(inviteId)) {
            return res.status(400).json({ message: "Invalid invite id" });
        }
        const chat = await (0, chats_service_1.acceptGroupInvite)(inviteId, currentUserId);
        const io = (0, socket_1.getSocketServer)();
        emitChatUpdate(chat);
        io.to(`user:${currentUserId}`).emit("group_invites:updated");
        return res.status(200).json({
            message: "Invite accepted",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to accept invite",
        });
    }
};
exports.acceptInvite = acceptInvite;
const rejectInvite = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const inviteIdParam = req.params.inviteId;
        const inviteId = Array.isArray(inviteIdParam) ? inviteIdParam[0] : inviteIdParam;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!inviteId || !(0, validation_1.isValidUuid)(inviteId)) {
            return res.status(400).json({ message: "Invalid invite id" });
        }
        await (0, chats_service_1.rejectGroupInvite)(inviteId, currentUserId);
        (0, socket_1.getSocketServer)().to(`user:${currentUserId}`).emit("group_invites:updated");
        return res.status(200).json({
            message: "Invite rejected",
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to reject invite",
        });
    }
};
exports.rejectInvite = rejectInvite;
const changeParticipantRole = async (req, res) => {
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
        if (!chatId || !(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        if (!participantId || !(0, validation_1.isValidUuid)(participantId)) {
            return res.status(400).json({ message: "Invalid participant id" });
        }
        if (role !== "MEMBER" && role !== "ADMIN") {
            return res.status(400).json({ message: "Role must be MEMBER or ADMIN" });
        }
        const chat = await (0, chats_service_1.updateParticipantRole)(chatId, actorUserId, participantId, role);
        emitChatUpdate(chat);
        return res.status(200).json({
            message: "Participant role updated",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to update participant role",
        });
    }
};
exports.changeParticipantRole = changeParticipantRole;
const removeParticipant = async (req, res) => {
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
        if (!chatId || !(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        if (!participantId || !(0, validation_1.isValidUuid)(participantId)) {
            return res.status(400).json({ message: "Invalid participant id" });
        }
        const chat = await (0, chats_service_1.removeGroupMember)(chatId, actorUserId, participantId);
        emitChatUpdate(chat);
        return res.status(200).json({
            message: "Participant removed",
            chat,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to remove participant",
        });
    }
};
exports.removeParticipant = removeParticipant;
const leaveGroupController = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const chatIdParam = req.params.chatId;
        const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!chatId || !(0, validation_1.isValidUuid)(chatId)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }
        const chat = await (0, chats_service_1.leaveGroup)(chatId, currentUserId);
        if (chat) {
            emitChatUpdate(chat);
        }
        (0, socket_1.getSocketServer)().to(`user:${currentUserId}`).emit("chat:left", { chatId });
        return res.status(200).json({
            message: "Left group successfully",
            chat: chat || null,
            chatId,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to leave group",
        });
    }
};
exports.leaveGroupController = leaveGroupController;
//# sourceMappingURL=chats.controller.js.map