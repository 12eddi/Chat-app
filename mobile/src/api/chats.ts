import { api } from "./http";
import type { Chat, Message } from "../types/chat";

type ChatsResponse = {
  message: string;
  chats: Chat[];
};

type MessagesResponse = {
  message: string;
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
};

type CreateMessageResponse = {
  message: string;
  messageData: Message;
};

export async function fetchChats() {
  const { data } = await api.get<ChatsResponse>("/api/chats");
  return data;
}

export async function fetchChatMessages(chatId: string) {
  const { data } = await api.get<MessagesResponse>(`/api/chats/${chatId}/messages`);
  return data;
}

export async function sendChatMessage(chatId: string, content: string) {
  const { data } = await api.post<CreateMessageResponse>(
    `/api/chats/${chatId}/messages`,
    { content }
  );

  return data;
}
