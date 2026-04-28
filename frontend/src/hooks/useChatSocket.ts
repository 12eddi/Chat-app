import { useEffect } from "react";
import { socket } from "../socket";
import type { Message } from "../types/chat";
import type { AppNotification } from "../types/notification";

type TypingPayload = {
  chatId: string;
  userId: string;
  name?: string;
};

type UseChatSocketParams = {
  currentUserId?: string;
  selectedChatId?: string;
  editingMessageId: string | null;
  loadChats: () => void | Promise<void>;
  loadInvites: () => void | Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setOnlineUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  setPresenceByUserId: React.Dispatch<
    React.SetStateAction<Record<string, "online" | "away">>
  >;
  setTypingUser: React.Dispatch<React.SetStateAction<TypingPayload | null>>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingContent: React.Dispatch<React.SetStateAction<string>>;
  onLeftChat: (chatId: string) => void;
};

export function useChatSocket({
  currentUserId,
  selectedChatId,
  editingMessageId,
  loadChats,
  loadInvites,
  setMessages,
  setOnlineUserIds,
  setPresenceByUserId,
  setTypingUser,
  setUnreadCounts,
  setNotifications,
  setEditingMessageId,
  setEditingContent,
  onLeftChat,
}: UseChatSocketParams) {
  useEffect(() => {
    if (!currentUserId) return;
    socket.emit("join_app", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage: Message) => {
      if (newMessage.sender.id !== currentUserId) {
        socket.emit("message_delivered", {
          messageId: newMessage.id,
          chatId: newMessage.chatId,
          recipientId: currentUserId,
        });
      }

      if (!selectedChatId || newMessage.chatId !== selectedChatId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.chatId]: (prev[newMessage.chatId] || 0) + 1,
        }));
        void loadChats();

        if (
          newMessage.sender.id !== currentUserId &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState !== "visible"
        ) {
          const body = newMessage.imageUrl
            ? newMessage.content
              ? `${newMessage.content} (image)`
              : "Sent an image"
            : newMessage.content;

          const notification = new Notification(
            `Message from ${newMessage.sender.firstName}`,
            { body }
          );

          notification.onclick = () => {
            window.focus();
          };
        }

        return;
      }

      setMessages((prev) => [...prev, newMessage]);

      if (newMessage.sender.id !== currentUserId) {
        socket.emit("messages_read", {
          chatId: newMessage.chatId,
          readerId: currentUserId,
        });
      }

      void loadChats();
    };

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUserIds(userIds);
    };

    const handlePresenceSnapshot = (
      snapshot: Record<string, "online" | "away">
    ) => {
      setPresenceByUserId(snapshot);
    };

    const handleTyping = (payload: TypingPayload) => {
      if (!selectedChatId || payload.chatId !== selectedChatId) return;
      if (payload.userId === currentUserId) return;
      setTypingUser(payload);
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (!selectedChatId || payload.chatId !== selectedChatId) return;
      if (payload.userId === currentUserId) return;
      setTypingUser(null);
    };

    const handleMessageDelivered = ({
      messageId,
      recipientId,
    }: {
      messageId: string;
      chatId: string;
      recipientId: string;
    }) => {
      if (recipientId === currentUserId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId && message.sender.id === currentUserId
            ? {
                ...message,
                status: message.status === "READ" ? "READ" : "DELIVERED",
              }
            : message
        )
      );
    };

    const handleMessagesRead = ({
      chatId,
      readerId,
      messageIds,
    }: {
      chatId: string;
      readerId: string;
      messageIds?: string[];
    }) => {
      if (readerId === currentUserId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.chatId === chatId &&
          message.sender.id === currentUserId &&
          (!messageIds || messageIds.includes(message.id))
            ? {
                ...message,
                status: "READ",
              }
            : message
        )
      );
    };

    const handleMessageUpdated = (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
      void loadChats();
    };

    const handleMessageDeleted = (deletedMessage: Message) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === deletedMessage.id ? deletedMessage : message
        )
      );

      if (editingMessageId === deletedMessage.id) {
        setEditingMessageId(null);
        setEditingContent("");
      }

      void loadChats();
    };

    const handleNotification = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      void loadChats();
    };

    const handleChatUpdated = () => {
      void loadChats();
    };

    const handleInviteUpdated = () => {
      void loadInvites();
    };

    const handleChatLeft = ({ chatId }: { chatId: string }) => {
      onLeftChat(chatId);
      void loadChats();
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("online_users", handleOnlineUsers);
    socket.on("presence_snapshot", handlePresenceSnapshot);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("messages_read", handleMessagesRead);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("notification:new", handleNotification);
    socket.on("chat:updated", handleChatUpdated);
    socket.on("group_invites:updated", handleInviteUpdated);
    socket.on("chat:left", handleChatLeft);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("online_users", handleOnlineUsers);
      socket.off("presence_snapshot", handlePresenceSnapshot);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("messages_read", handleMessagesRead);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("notification:new", handleNotification);
      socket.off("chat:updated", handleChatUpdated);
      socket.off("group_invites:updated", handleInviteUpdated);
      socket.off("chat:left", handleChatLeft);
    };
  }, [
    currentUserId,
    editingMessageId,
    loadChats,
    loadInvites,
    onLeftChat,
    selectedChatId,
    setEditingContent,
    setEditingMessageId,
    setMessages,
    setNotifications,
    setOnlineUserIds,
    setPresenceByUserId,
    setTypingUser,
    setUnreadCounts,
  ]);
}
