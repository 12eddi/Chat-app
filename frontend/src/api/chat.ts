import api from "./axios";
import type { Chat, GroupInvite, Message } from "../types/chat";

export const getChatsRequest = async () => {
  const { data } = await api.get<{ message: string; chats: Chat[] }>("/chats");
  return data;
};

export const getGroupInvitesRequest = async () => {
  const { data } = await api.get<{ message: string; invites: GroupInvite[] }>(
    "/chats/invites"
  );
  return data;
};

export const acceptGroupInviteRequest = async (inviteId: string) => {
  const { data } = await api.post<{ message: string; chat: Chat }>(
    `/chats/invites/${inviteId}/accept`
  );
  return data;
};

export const rejectGroupInviteRequest = async (inviteId: string) => {
  const { data } = await api.post<{ message: string }>(
    `/chats/invites/${inviteId}/reject`
  );
  return data;
};

export const createDirectChatRequest = async (userId: string) => {
  const { data } = await api.post<{ message: string; chat: Chat }>("/chats/direct", {
    userId,
  });
  return data;
};

export const createGroupChatRequest = async (name: string, userIds: string[]) => {
  const { data } = await api.post<{ message: string; chat: Chat }>("/chats/group", {
    name,
    userIds,
  });
  return data;
};

export const addGroupParticipantsRequest = async (chatId: string, userIds: string[]) => {
  const { data } = await api.post<{ message: string; chat: Chat }>(
    `/chats/${chatId}/participants`,
    { userIds }
  );
  return data;
};

export const updateGroupDetailsRequest = async (params: {
  chatId: string;
  name?: string;
  photo?: File | null;
}) => {
  const formData = new FormData();

  if (params.name !== undefined) {
    formData.append("name", params.name);
  }

  if (params.photo) {
    formData.append("photo", params.photo);
  }

  const { data } = await api.patch<{ message: string; chat: Chat }>(
    `/chats/${params.chatId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const updateGroupParticipantRoleRequest = async (
  chatId: string,
  participantId: string,
  role: "MEMBER" | "ADMIN"
) => {
  const { data } = await api.patch<{ message: string; chat: Chat }>(
    `/chats/${chatId}/participants/${participantId}/role`,
    { role }
  );
  return data;
};

export const removeGroupParticipantRequest = async (
  chatId: string,
  participantId: string
) => {
  const { data } = await api.delete<{ message: string; chat: Chat }>(
    `/chats/${chatId}/participants/${participantId}`
  );
  return data;
};

export const leaveGroupRequest = async (chatId: string) => {
  const { data } = await api.post<{ message: string; chat: Chat | null; chatId: string }>(
    `/chats/${chatId}/leave`
  );
  return data;
};

export const getMessagesRequest = async (
  chatId: string,
  params?: {
    limit?: number;
    cursor?: string | null;
    markRead?: boolean;
  }
) => {
  const { data } = await api.get<{
    message: string;
    messages: Message[];
    hasMore?: boolean;
    nextCursor?: string | null;
  }>(`/chats/${chatId}/messages`, {
    params: {
      limit: params?.limit,
      cursor: params?.cursor ?? undefined,
      markRead: params?.markRead ?? undefined,
    },
  });
  return data;
};

export const getChatMediaRequest = async (
  chatId: string,
  params?: {
    limit?: number;
    cursor?: string | null;
  }
) => {
  const { data } = await api.get<{
    message: string;
    messages: Message[];
    hasMore?: boolean;
    nextCursor?: string | null;
  }>(`/chats/${chatId}/messages`, {
    params: {
      limit: params?.limit,
      cursor: params?.cursor ?? undefined,
      onlyMedia: true,
      markRead: false,
    },
  });
  return data;
};

export const sendMessageRequest = async (params: {
  chatId: string;
  content?: string;
  image?: File | null;
  scheduledFor?: string | null;
  onUploadProgress?: (progressPercent: number) => void;
  signal?: AbortSignal;
}) => {
  const formData = new FormData();
  formData.append("content", params.content ?? "");

  if (params.image) {
    formData.append("image", params.image);
  }

  if (params.scheduledFor) {
    formData.append("scheduledFor", params.scheduledFor);
  }

  const { data } = await api.post<{ message: string; messageData: Message }>(
    `/chats/${params.chatId}/messages`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!params.onUploadProgress) {
          return;
        }

        const total = event.total ?? 0;
        if (!total) {
          return;
        }

        const percent = Math.round((event.loaded / total) * 100);
        params.onUploadProgress(percent);
      },
      signal: params.signal,
    }
  );
  return data;
};

export const updateMessageRequest = async (messageId: string, content: string) => {
  const { data } = await api.patch<{ message: string; messageData: Message }>(
    `/chats/messages/${messageId}`,
    { content }
  );
  return data;
};

export const updateScheduledMessageRequest = async (params: {
  messageId: string;
  content?: string;
  scheduledFor: string;
}) => {
  const { data } = await api.patch<{ message: string; messageData: Message }>(
    `/chats/messages/${params.messageId}/schedule`,
    {
      content: params.content ?? "",
      scheduledFor: params.scheduledFor,
    }
  );
  return data;
};

export const cancelScheduledMessageRequest = async (messageId: string) => {
  const { data } = await api.post<{ message: string; messageData: Message }>(
    `/chats/messages/${messageId}/cancel-schedule`
  );
  return data;
};

export const deleteMessageRequest = async (messageId: string) => {
  const { data } = await api.delete<{ message: string; messageData: Message }>(
    `/chats/messages/${messageId}`
  );
  return data;
};

export const reactToMessageRequest = async (messageId: string, emoji: string) => {
  const { data } = await api.post<{ message: string; messageData: Message }>(
    `/chats/messages/${messageId}/reactions`,
    { emoji }
  );
  return data;
};
