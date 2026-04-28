import prisma from "../../config/prisma";

type CreateNotificationInput = {
  userId: string;
  type: "MESSAGE" | "GROUP_INVITE" | "GROUP_EVENT";
  title: string;
  body: string;
  chatId?: string;
  messageId?: string;
};

const notificationInclude = {
  chat: {
    select: {
      id: true,
      type: true,
      name: true,
    },
  },
  message: {
    select: {
      id: true,
      content: true,
      chatId: true,
    },
  },
};

export const createNotification = async (input: CreateNotificationInput) => {
  return prisma.notification.create({
    data: input,
    include: notificationInclude,
  });
};

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
    include: notificationInclude,
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};
