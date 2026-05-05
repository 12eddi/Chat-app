import { Request, Response } from "express";
import {
  cancelScheduledMessage,
  deleteMessage,
  editMessage,
  getMessagesPage,
  markMessagesAsRead,
  rescheduleMessage,
  sendMessage,
  toggleMessageReaction,
} from "./messages.service";
import { getSocketServer } from "../../socket";
import {
  isValidUuid,
  parseScheduledFor,
  validateMessageContent,
  validateOptionalMessageContent,
} from "../../utils/validation";
import { createNotification } from "../notifications/notifications.service";
import { uploadImageBuffer } from "../../utils/cloudinary";
import { isUserActiveInChat } from "../../socket";
import { sendPushToUserDevices } from "../../utils/push";

type UploadedMessageImage = {
  buffer: Buffer;
};

const buildImageUrl = async (file?: UploadedMessageImage | null) => {
  if (!file) {
    return null;
  }

  const uploadedImage = await uploadImageBuffer(file, "chat-app/messages");
  return uploadedImage.secure_url;
};

const emitImmediateMessageDelivery = async (
  message: {
    id: string;
    chatId: string;
    content: string;
    imageUrl?: string | null;
    sender: { firstName: string };
  },
  recipientIds: string[]
) => {
  const io = getSocketServer();

  await Promise.all(
    recipientIds.map(async (recipientId) => {
      io.to(`user:${recipientId}`).emit("receive_message", message);

      const previewBody = message.imageUrl
        ? message.content
          ? `${message.content} (image)`
          : "Sent an image"
        : message.content;

      const notification = await createNotification({
        userId: recipientId,
        type: "MESSAGE",
        title: `New message from ${message.sender.firstName}`,
        body:
          previewBody.length > 80 ? `${previewBody.slice(0, 77)}...` : previewBody,
        chatId: message.chatId,
        messageId: message.id,
      });

      io.to(`user:${recipientId}`).emit("notification:new", notification);

      if (!isUserActiveInChat(recipientId, message.chatId)) {
        const pushBody =
          previewBody.length > 120
            ? `${previewBody.slice(0, 117)}...`
            : previewBody;

        await sendPushToUserDevices({
          userId: recipientId,
          title: message.sender.firstName,
          body: pushBody,
          data: {
            chatId: message.chatId,
            messageId: message.id,
            type: "new_message",
          },
        });
      }
    })
  );
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId) {
      return res.status(400).json({ message: "Chat id is required" });
    }

    if (!isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const uploadedImageFile =
      (req.file as unknown as UploadedMessageImage | undefined) || undefined;
    const imageUrl = await buildImageUrl(uploadedImageFile);
    const scheduledFor = parseScheduledFor(req.body?.scheduledFor);
    const content = imageUrl
      ? validateOptionalMessageContent(req.body?.content)
      : validateMessageContent(req.body?.content);

    const { message, recipientIds, isScheduled } = await sendMessage(chatId, userId, content, {
      imageUrl,
      scheduledFor,
    });

    if (!isScheduled) {
      await emitImmediateMessageDelivery(message, recipientIds);
    }

    return res.status(201).json({
      message: isScheduled ? "Message scheduled successfully" : "Message sent successfully",
      messageData: message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const fetchMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatIdParam = req.params.chatId;
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId) {
      return res.status(400).json({ message: "Chat id is required" });
    }

    if (!isValidUuid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const rawLimit = req.query?.limit;
    const limit =
      typeof rawLimit === "string" && rawLimit.trim() ? Number(rawLimit) : undefined;

    const rawCursor = req.query?.cursor;
    const cursorId = typeof rawCursor === "string" && rawCursor.trim() ? rawCursor : null;

    const rawOnlyMedia = req.query?.onlyMedia;
    const onlyMedia = rawOnlyMedia === "true" || rawOnlyMedia === "1";

    const rawMarkRead = req.query?.markRead;
    const markRead = rawMarkRead === undefined ? true : rawMarkRead === "true" || rawMarkRead === "1";

    const readResult = markRead ? await markMessagesAsRead(chatId, userId) : null;
    const pageOptions: { limit?: number; cursorId?: string | null; onlyMedia?: boolean } =
      { cursorId, onlyMedia };

    if (Number.isFinite(limit)) {
      pageOptions.limit = limit as number;
    }

    const page = await getMessagesPage(chatId, userId, pageOptions);

    if (readResult && readResult.messageIds.length > 0) {
      const io = getSocketServer();

      readResult.senderIds.forEach((senderId) => {
        io.to(`user:${senderId}`).emit("messages_read", {
          chatId,
          readerId: userId,
          messageIds: readResult.messageIds,
        });
      });
    }

    return res.status(200).json({
      message: "Messages fetched successfully",
      messages: page.messages,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const updateMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageIdParam = req.params.messageId;
    const messageId = Array.isArray(messageIdParam)
      ? messageIdParam[0]
      : messageIdParam;
    const { content } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" });
    }

    if (!isValidUuid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const trimmedContent = validateMessageContent(content);
    const result = await editMessage(messageId, userId, trimmedContent);
    const io = getSocketServer();

    result.participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_updated", result.message);
    });

    return res.status(200).json({
      message: "Message updated successfully",
      messageData: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const removeMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageIdParam = req.params.messageId;
    const messageId = Array.isArray(messageIdParam)
      ? messageIdParam[0]
      : messageIdParam;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" });
    }

    if (!isValidUuid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const result = await deleteMessage(messageId, userId);
    const io = getSocketServer();

    result.participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_deleted", result.message);
    });

    return res.status(200).json({
      message: "Message deleted successfully",
      messageData: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const updateScheduledMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageIdParam = req.params.messageId;
    const messageId = Array.isArray(messageIdParam)
      ? messageIdParam[0]
      : messageIdParam;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" });
    }

    if (!isValidUuid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const scheduledFor = parseScheduledFor(req.body?.scheduledFor);

    if (!scheduledFor) {
      return res.status(400).json({ message: "scheduledFor is required" });
    }

    const content = validateOptionalMessageContent(req.body?.content);
    const result = await rescheduleMessage(messageId, userId, content, scheduledFor);
    const io = getSocketServer();

    result.participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_updated", result.message);
    });

    return res.status(200).json({
      message: "Scheduled message updated successfully",
      messageData: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const cancelScheduledMessageController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageIdParam = req.params.messageId;
    const messageId = Array.isArray(messageIdParam)
      ? messageIdParam[0]
      : messageIdParam;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" });
    }

    if (!isValidUuid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const result = await cancelScheduledMessage(messageId, userId);
    const io = getSocketServer();

    result.participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_deleted", result.message);
    });

    return res.status(200).json({
      message: "Scheduled message canceled successfully",
      messageData: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const reactToMessageController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageIdParam = req.params.messageId;
    const messageId = Array.isArray(messageIdParam)
      ? messageIdParam[0]
      : messageIdParam;
    const emoji = req.body?.emoji;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" });
    }

    if (!isValidUuid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    if (typeof emoji !== "string") {
      return res.status(400).json({ message: "emoji is required" });
    }

    const result = await toggleMessageReaction(messageId, userId, emoji);
    const io = getSocketServer();

    result.participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("message_updated", result.message);
    });

    return res.status(200).json({
      message: "Reaction updated successfully",
      messageData: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
