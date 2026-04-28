import prisma from "../../config/prisma";
import { MESSAGE_MAX_LENGTH } from "../../utils/validation";

const messageInclude = {
  sender: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      profilePhotoUrl: true,
    },
  },
  reactions: {
    include: {
      user: {
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
      createdAt: "asc" as const,
    },
  },
};

const getMessageParticipantIds = (participants: Array<{ userId: string }>) =>
  participants.map((participant) => participant.userId);

const getChatForMember = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      type: true,
      participants: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found or access denied");
  }

  return chat;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  options?: {
    imageUrl?: string | null;
    scheduledFor?: Date | null;
  }
) => {
  const trimmedContent = content.trim();
  const normalizedImageUrl = options?.imageUrl || null;

  if (!trimmedContent && !normalizedImageUrl) {
    throw new Error("Message content or image is required");
  }

  if (trimmedContent.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
  }

  const chat = await getChatForMember(chatId, senderId);
  const scheduledFor = options?.scheduledFor ?? null;
  const sendImmediately = !scheduledFor || scheduledFor <= new Date();

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: {
        chatId,
        senderId,
        content: trimmedContent,
        imageUrl: normalizedImageUrl,
        scheduledFor,
        sentAt: sendImmediately ? new Date() : null,
        status: "SENT",
      },
      include: messageInclude,
    });

    await tx.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
      },
    });

    return createdMessage;
  });

  return {
    message,
    recipientIds: sendImmediately
      ? chat.participants
          .map((participant) => participant.userId)
          .filter((participantId) => participantId !== senderId)
      : [],
    isScheduled: !sendImmediately,
  };
};

export const getMessages = async (chatId: string, userId: string) => {
  await getChatForMember(chatId, userId);

  return prisma.message.findMany({
    where: {
      chatId,
      deletedAt: null,
      OR: [
        {
          sentAt: {
            not: null,
          },
        },
        {
          senderId: userId,
          sentAt: null,
        },
      ],
    },
    include: messageInclude,
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getMessagesPage = async (
  chatId: string,
  userId: string,
  options?: {
    limit?: number;
    cursorId?: string | null;
    onlyMedia?: boolean;
  }
) => {
  await getChatForMember(chatId, userId);

  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const cursorId = options?.cursorId ?? null;
  const onlyMedia = options?.onlyMedia ?? false;

  const items = await prisma.message.findMany({
    where: {
      chatId,
      deletedAt: null,
      ...(onlyMedia
        ? {
            imageUrl: {
              not: null,
            },
          }
        : {}),
      OR: [
        {
          sentAt: {
            not: null,
          },
        },
        {
          senderId: userId,
          sentAt: null,
        },
      ],
    },
    include: messageInclude,
    orderBy: {
      createdAt: "desc",
    },
    ...(cursorId
      ? {
          cursor: { id: cursorId },
          skip: 1,
        }
      : {}),
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const messages = pageItems.reverse(); // return asc so the UI can just render top->bottom
  const nextCursor = hasMore ? messages[0]?.id ?? null : null;

  return {
    messages,
    hasMore,
    nextCursor,
  };
};

const getOwnedMessageForUpdate = async (messageId: string, userId: string) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId,
      deletedAt: null,
      chat: {
        participants: {
          some: {
            userId,
          },
        },
      },
    },
    select: {
      id: true,
      chatId: true,
      senderId: true,
      content: true,
      imageUrl: true,
      scheduledFor: true,
      sentAt: true,
      chat: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found or access denied");
  }

  return message;
};

const getScheduledMessageForSender = async (messageId: string, userId: string) => {
  const message = await getOwnedMessageForUpdate(messageId, userId);

  if (!message.scheduledFor || message.sentAt) {
    throw new Error("Only pending scheduled messages can be updated");
  }

  return message;
};

export const editMessage = async (
  messageId: string,
  userId: string,
  content: string
) => {
  if (content.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
  }

  const messageToUpdate = await getOwnedMessageForUpdate(messageId, userId);

  const updatedMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
      },
      include: messageInclude,
    });

    await tx.chat.update({
      where: { id: message.chatId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  });

  return {
    message: updatedMessage,
    participantIds:
      messageToUpdate.sentAt || !updatedMessage.scheduledFor
        ? messageToUpdate.chat.participants.map((participant) => participant.userId)
        : [userId],
  };
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const messageToDelete = await getOwnedMessageForUpdate(messageId, userId);

  const deletedMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.message.update({
      where: {
        id: messageId,
      },
      data: {
        deletedAt: new Date(),
      },
      include: messageInclude,
    });

    await tx.chat.update({
      where: { id: message.chatId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  });

  return {
    message: deletedMessage,
    participantIds:
      messageToDelete.sentAt || !deletedMessage.scheduledFor
        ? messageToDelete.chat.participants.map((participant) => participant.userId)
        : [userId],
  };
};

export const rescheduleMessage = async (
  messageId: string,
  userId: string,
  content: string,
  scheduledFor: Date
) => {
  if (content.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
  }

  const scheduledMessage = await getScheduledMessageForSender(messageId, userId);

  if (!content.trim() && !scheduledMessage.imageUrl) {
    throw new Error("Message content or image is required");
  }

  const message = await prisma.$transaction(async (tx) => {
    const updatedMessage = await tx.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: content.trim(),
        scheduledFor,
      },
      include: messageInclude,
    });

    await tx.chat.update({
      where: {
        id: scheduledMessage.chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return updatedMessage;
  });

  return {
    message,
    participantIds: [userId],
  };
};

export const cancelScheduledMessage = async (messageId: string, userId: string) => {
  const scheduledMessage = await getScheduledMessageForSender(messageId, userId);

  const cancelledMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.message.update({
      where: {
        id: messageId,
      },
      data: {
        deletedAt: new Date(),
      },
      include: messageInclude,
    });

    await tx.chat.update({
      where: {
        id: scheduledMessage.chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  });

  return {
    message: cancelledMessage,
    participantIds: [userId],
  };
};

export const toggleMessageReaction = async (
  messageId: string,
  userId: string,
  emoji: string
) => {
  const trimmedEmoji = emoji.trim();

  if (!trimmedEmoji || trimmedEmoji.length > 16) {
    throw new Error("Reaction emoji is invalid");
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      deletedAt: null,
      chat: {
        participants: {
          some: {
            userId,
          },
        },
      },
    },
    select: {
      id: true,
      chatId: true,
      chat: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found or access denied");
  }

  const existingReaction = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji: trimmedEmoji,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingReaction) {
    await prisma.messageReaction.delete({
      where: {
        id: existingReaction.id,
      },
    });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji: trimmedEmoji,
      },
    });
  }

  const updatedMessage = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    include: messageInclude,
  });

  if (!updatedMessage) {
    throw new Error("Message not found after reaction update");
  }

  return {
    message: updatedMessage,
    participantIds: getMessageParticipantIds(message.chat.participants),
  };
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  await getChatForMember(chatId, userId);

  const unreadMessages = await prisma.message.findMany({
    where: {
      chatId,
      senderId: { not: userId },
      sentAt: {
        not: null,
      },
      status: { not: "READ" },
    },
    select: {
      id: true,
      senderId: true,
    },
  });

  if (unreadMessages.length === 0) {
    return {
      messageIds: [],
      senderIds: [],
    };
  }

  await prisma.message.updateMany({
    where: {
      id: {
        in: unreadMessages.map((message) => message.id),
      },
    },
    data: {
      status: "READ",
    },
  });

  return {
    messageIds: unreadMessages.map((message) => message.id),
    senderIds: [...new Set(unreadMessages.map((message) => message.senderId))],
  };
};

export const markMessageAsDelivered = async (
  messageId: string,
  recipientId: string
) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      sentAt: {
        not: null,
      },
      chat: {
        participants: {
          some: {
            userId: recipientId,
          },
        },
      },
      senderId: { not: recipientId },
      status: "SENT",
    },
    select: {
      id: true,
      senderId: true,
      chatId: true,
    },
  });

  if (!message) {
    return null;
  }

  await prisma.message.update({
    where: {
      id: message.id,
    },
    data: {
      status: "DELIVERED",
    },
  });

  return message;
};

export const getDueScheduledMessages = async (limit = 20) => {
  return prisma.message.findMany({
    where: {
      deletedAt: null,
      scheduledFor: {
        lte: new Date(),
      },
      sentAt: null,
    },
    include: {
      ...messageInclude,
      chat: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledFor: "asc",
    },
    take: limit,
  });
};

export const markScheduledMessageAsSent = async (messageId: string) => {
  const sentAt = new Date();
  const claimResult = await prisma.message.updateMany({
    where: {
      id: messageId,
      deletedAt: null,
      sentAt: null,
    },
    data: {
      sentAt,
      status: "SENT",
    },
  });

  if (claimResult.count === 0) {
    return null;
  }

  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    include: messageInclude,
  });

  if (!message) {
    return null;
  }

  await prisma.chat.update({
    where: {
      id: message.chatId,
    },
    data: {
      updatedAt: sentAt,
    },
  });

  return message;
};
