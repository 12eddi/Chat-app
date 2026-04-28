export type AppNotification = {
  id: string;
  userId: string;
  type: "MESSAGE" | "GROUP_INVITE" | "GROUP_EVENT";
  title: string;
  body: string;
  isRead: boolean;
  chatId?: string | null;
  messageId?: string | null;
  createdAt: string;
  chat?: {
    id: string;
    type: string;
    name?: string | null;
  } | null;
  message?: {
    id: string;
    content: string;
    chatId: string;
  } | null;
};
