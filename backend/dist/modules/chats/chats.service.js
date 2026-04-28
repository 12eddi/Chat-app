"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveGroup = exports.removeGroupMember = exports.updateParticipantRole = exports.rejectGroupInvite = exports.acceptGroupInvite = exports.inviteGroupParticipants = exports.updateGroupDetails = exports.createGroupChat = exports.getPendingGroupInvites = exports.getUserChats = exports.getOrCreateDirectChat = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const chat_select_1 = require("./chat.select");
const getOrCreateSavedMessagesChat = async (currentUserId) => {
    const existingChat = await prisma_1.default.chat.findFirst({
        where: {
            type: "saved",
            participants: {
                some: {
                    userId: currentUserId,
                },
            },
        },
        include: chat_select_1.chatInclude,
    });
    if (existingChat) {
        return existingChat;
    }
    return prisma_1.default.chat.create({
        data: {
            type: "saved",
            name: "Saved Messages",
            createdById: currentUserId,
            participants: {
                create: [{ userId: currentUserId, role: "OWNER" }],
            },
        },
        include: chat_select_1.chatInclude,
    });
};
const ensureGroupChatAccess = async (chatId, userId) => {
    const chat = await prisma_1.default.chat.findFirst({
        where: {
            id: chatId,
            type: "group",
            participants: {
                some: {
                    userId,
                },
            },
        },
        include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            profilePhotoUrl: true,
                        },
                    },
                },
            },
            invites: {
                where: {
                    status: "PENDING",
                },
            },
        },
    });
    if (!chat) {
        throw new Error("Group chat not found or access denied");
    }
    return chat;
};
const ensureGroupManagementAccess = async (chatId, userId, allowedRoles) => {
    const chat = await ensureGroupChatAccess(chatId, userId);
    const currentParticipant = chat.participants.find((participant) => participant.userId === userId);
    if (!currentParticipant || !allowedRoles.includes(currentParticipant.role)) {
        throw new Error("You do not have permission to manage this group");
    }
    return {
        chat,
        currentParticipant,
    };
};
const getOrCreateDirectChat = async (currentUserId, targetUserId) => {
    const existingChats = await prisma_1.default.chat.findMany({
        where: {
            type: "direct",
            participants: {
                some: {
                    userId: currentUserId,
                },
            },
        },
        include: chat_select_1.chatInclude,
    });
    const existingChat = existingChats.find((chat) => {
        const participantIds = chat.participants.map((participant) => participant.userId);
        return (participantIds.length === 2 &&
            participantIds.includes(currentUserId) &&
            participantIds.includes(targetUserId));
    });
    if (existingChat) {
        return existingChat;
    }
    return prisma_1.default.chat.create({
        data: {
            type: "direct",
            participants: {
                create: [{ userId: currentUserId }, { userId: targetUserId }],
            },
        },
        include: chat_select_1.chatInclude,
    });
};
exports.getOrCreateDirectChat = getOrCreateDirectChat;
const getUserChats = async (currentUserId) => {
    await getOrCreateSavedMessagesChat(currentUserId);
    return prisma_1.default.chat.findMany({
        where: {
            participants: {
                some: {
                    userId: currentUserId,
                },
            },
        },
        include: chat_select_1.chatInclude,
        orderBy: {
            updatedAt: "desc",
        },
    });
};
exports.getUserChats = getUserChats;
const getPendingGroupInvites = async (currentUserId) => {
    return prisma_1.default.groupInvite.findMany({
        where: {
            userId: currentUserId,
            status: "PENDING",
        },
        include: {
            chat: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
            invitedBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePhotoUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getPendingGroupInvites = getPendingGroupInvites;
const createGroupChat = async (currentUserId, name, memberIds) => {
    const uniqueMemberIds = [...new Set(memberIds.filter((id) => id && id !== currentUserId))];
    if (uniqueMemberIds.length === 0) {
        throw new Error("Select at least one other user for the group");
    }
    const users = await prisma_1.default.user.findMany({
        where: {
            id: {
                in: uniqueMemberIds,
            },
        },
        select: {
            id: true,
        },
    });
    if (users.length !== uniqueMemberIds.length) {
        throw new Error("One or more selected users could not be found");
    }
    return prisma_1.default.chat.create({
        data: {
            type: "group",
            name,
            createdById: currentUserId,
            participants: {
                create: [{ userId: currentUserId, role: "OWNER" }],
            },
            invites: {
                create: uniqueMemberIds.map((userId) => ({
                    userId,
                    invitedById: currentUserId,
                    status: "PENDING",
                })),
            },
        },
        include: chat_select_1.chatInclude,
    });
};
exports.createGroupChat = createGroupChat;
const updateGroupDetails = async (chatId, currentUserId, input) => {
    const { chat } = await ensureGroupManagementAccess(chatId, currentUserId, [
        "OWNER",
        "ADMIN",
    ]);
    const nextName = typeof input.name === "string" ? input.name.trim() : undefined;
    if (nextName !== undefined && nextName.length < 2) {
        throw new Error("Group name must be at least 2 characters");
    }
    if (nextName === undefined && input.photoUrl === undefined) {
        throw new Error("No group changes provided");
    }
    return prisma_1.default.chat.update({
        where: {
            id: chat.id,
        },
        data: {
            ...(nextName !== undefined ? { name: nextName } : {}),
            ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
            updatedAt: new Date(),
        },
        include: chat_select_1.chatInclude,
    });
};
exports.updateGroupDetails = updateGroupDetails;
const inviteGroupParticipants = async (chatId, currentUserId, memberIds) => {
    const uniqueMemberIds = [...new Set(memberIds.filter(Boolean))];
    if (uniqueMemberIds.length === 0) {
        throw new Error("Select at least one user to invite");
    }
    const { chat } = await ensureGroupManagementAccess(chatId, currentUserId, [
        "OWNER",
        "ADMIN",
    ]);
    const existingParticipantIds = new Set(chat.participants.map((participant) => participant.userId));
    const existingInviteIds = new Set(chat.invites.map((invite) => invite.userId));
    const idsToInvite = uniqueMemberIds.filter((userId) => !existingParticipantIds.has(userId) &&
        !existingInviteIds.has(userId) &&
        userId !== currentUserId);
    if (idsToInvite.length === 0) {
        return prisma_1.default.chat.findUniqueOrThrow({
            where: { id: chatId },
            include: chat_select_1.chatInclude,
        });
    }
    const users = await prisma_1.default.user.findMany({
        where: {
            id: {
                in: idsToInvite,
            },
        },
        select: {
            id: true,
        },
    });
    if (users.length !== idsToInvite.length) {
        throw new Error("One or more selected users could not be found");
    }
    return prisma_1.default.chat.update({
        where: {
            id: chatId,
        },
        data: {
            invites: {
                create: idsToInvite.map((userId) => ({
                    userId,
                    invitedById: currentUserId,
                    status: "PENDING",
                })),
            },
            updatedAt: new Date(),
        },
        include: chat_select_1.chatInclude,
    });
};
exports.inviteGroupParticipants = inviteGroupParticipants;
const acceptGroupInvite = async (inviteId, currentUserId) => {
    const invite = await prisma_1.default.groupInvite.findFirst({
        where: {
            id: inviteId,
            userId: currentUserId,
            status: "PENDING",
        },
        select: {
            id: true,
            chatId: true,
            userId: true,
        },
    });
    if (!invite) {
        throw new Error("Invite not found");
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.groupInvite.update({
            where: {
                id: invite.id,
            },
            data: {
                status: "ACCEPTED",
            },
        });
        await tx.chatParticipant.create({
            data: {
                chatId: invite.chatId,
                userId: currentUserId,
                role: "MEMBER",
            },
        });
        await tx.chat.update({
            where: {
                id: invite.chatId,
            },
            data: {
                updatedAt: new Date(),
            },
        });
    });
    return prisma_1.default.chat.findUniqueOrThrow({
        where: {
            id: invite.chatId,
        },
        include: chat_select_1.chatInclude,
    });
};
exports.acceptGroupInvite = acceptGroupInvite;
const rejectGroupInvite = async (inviteId, currentUserId) => {
    const invite = await prisma_1.default.groupInvite.findFirst({
        where: {
            id: inviteId,
            userId: currentUserId,
            status: "PENDING",
        },
        select: {
            id: true,
            chatId: true,
        },
    });
    if (!invite) {
        throw new Error("Invite not found");
    }
    await prisma_1.default.groupInvite.update({
        where: {
            id: invite.id,
        },
        data: {
            status: "REJECTED",
        },
    });
    return invite.chatId;
};
exports.rejectGroupInvite = rejectGroupInvite;
const updateParticipantRole = async (chatId, actorUserId, participantId, role) => {
    const { chat, currentParticipant } = await ensureGroupManagementAccess(chatId, actorUserId, ["OWNER"]);
    const targetParticipant = chat.participants.find((participant) => participant.id === participantId);
    if (!targetParticipant) {
        throw new Error("Participant not found");
    }
    if (targetParticipant.role === "OWNER") {
        throw new Error("Owner role cannot be changed here");
    }
    if (currentParticipant.userId === targetParticipant.userId) {
        throw new Error("Use the leave group action instead");
    }
    await prisma_1.default.chatParticipant.update({
        where: {
            id: participantId,
        },
        data: {
            role,
        },
    });
    return prisma_1.default.chat.findUniqueOrThrow({
        where: {
            id: chatId,
        },
        include: chat_select_1.chatInclude,
    });
};
exports.updateParticipantRole = updateParticipantRole;
const removeGroupMember = async (chatId, actorUserId, participantId) => {
    const { chat, currentParticipant } = await ensureGroupManagementAccess(chatId, actorUserId, ["OWNER", "ADMIN"]);
    const targetParticipant = chat.participants.find((participant) => participant.id === participantId);
    if (!targetParticipant) {
        throw new Error("Participant not found");
    }
    if (targetParticipant.role === "OWNER") {
        throw new Error("Owner cannot be removed from the group");
    }
    if (currentParticipant.role !== "OWNER" && targetParticipant.role === "ADMIN") {
        throw new Error("Only the owner can remove an admin");
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.chatParticipant.delete({
            where: {
                id: participantId,
            },
        });
        await tx.chat.update({
            where: {
                id: chatId,
            },
            data: {
                updatedAt: new Date(),
            },
        });
    });
    return prisma_1.default.chat.findUniqueOrThrow({
        where: {
            id: chatId,
        },
        include: chat_select_1.chatInclude,
    });
};
exports.removeGroupMember = removeGroupMember;
const leaveGroup = async (chatId, currentUserId) => {
    const chat = await ensureGroupChatAccess(chatId, currentUserId);
    const currentParticipant = chat.participants.find((participant) => participant.userId === currentUserId);
    if (!currentParticipant) {
        throw new Error("Participant not found");
    }
    const remainingParticipants = chat.participants.filter((participant) => participant.userId !== currentUserId);
    await prisma_1.default.$transaction(async (tx) => {
        await tx.chatParticipant.delete({
            where: {
                id: currentParticipant.id,
            },
        });
        if (remainingParticipants.length === 0) {
            await tx.chat.delete({
                where: {
                    id: chatId,
                },
            });
            return;
        }
        if (currentParticipant.role === "OWNER") {
            const nextOwner = remainingParticipants.find((participant) => participant.role === "ADMIN") ||
                remainingParticipants[0];
            if (nextOwner) {
                await tx.chatParticipant.update({
                    where: {
                        id: nextOwner.id,
                    },
                    data: {
                        role: "OWNER",
                    },
                });
            }
        }
        await tx.chat.update({
            where: {
                id: chatId,
            },
            data: {
                updatedAt: new Date(),
            },
        });
    });
    const updatedChat = await prisma_1.default.chat.findUnique({
        where: {
            id: chatId,
        },
        include: chat_select_1.chatInclude,
    });
    return updatedChat;
};
exports.leaveGroup = leaveGroup;
//# sourceMappingURL=chats.service.js.map