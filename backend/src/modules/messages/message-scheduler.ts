import { env } from "../../config/env";
import { getSocketServer } from "../../socket";
import { createNotification } from "../notifications/notifications.service";
import { getDueScheduledMessages, markScheduledMessageAsSent } from "./messages.service";

let schedulerTimer: NodeJS.Timeout | null = null;
let isProcessingScheduledMessages = false;
let isStopping = false;

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
    })
  );
};

export const processScheduledMessages = async () => {
  if (isProcessingScheduledMessages || isStopping) {
    return 0;
  }

  isProcessingScheduledMessages = true;

  try {
    let processedCount = 0;
    const batchSize = env.scheduledMessageBatchSize;

    while (true) {
      const dueMessages = await getDueScheduledMessages(batchSize);

      if (dueMessages.length === 0) {
        break;
      }

      for (const dueMessage of dueMessages) {
        const sentMessage = await markScheduledMessageAsSent(dueMessage.id);

        if (!sentMessage) {
          continue;
        }

        const recipientIds = dueMessage.chat.participants
          .map((participant) => participant.userId)
          .filter((participantId) => participantId !== dueMessage.senderId);

        await emitImmediateMessageDelivery(sentMessage, recipientIds);
        processedCount += 1;
      }

      if (dueMessages.length < batchSize) {
        break;
      }
    }

    return processedCount;
  } finally {
    isProcessingScheduledMessages = false;
  }
};

const scheduleNextRun = (delayMs: number) => {
  if (isStopping) {
    return;
  }

  schedulerTimer = setTimeout(() => {
    void runProcessorLoop();
  }, delayMs);
};

const runProcessorLoop = async () => {
  if (isStopping) {
    return;
  }

  try {
    const processedCount = await processScheduledMessages();
    scheduleNextRun(processedCount >= env.scheduledMessageBatchSize ? 250 : env.scheduledMessagePollMs);
  } catch (error) {
    console.error("Failed to process scheduled messages:", error);
    scheduleNextRun(env.scheduledMessageErrorBackoffMs);
  }
};

export const startScheduledMessageProcessor = () => {
  if (schedulerTimer) {
    return;
  }

  isStopping = false;
  void runProcessorLoop();
};

export const stopScheduledMessageProcessor = () => {
  isStopping = true;

  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
};

export const registerScheduledMessageProcessorShutdown = () => {
  const shutdown = () => {
    stopScheduledMessageProcessor();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
};
