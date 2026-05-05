import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchChatMessages, sendChatMessage } from "../api/chats";
import { MessageBubble } from "../components/MessageBubble";
import { socket } from "../socket/client";
import { useAuthStore } from "../state/auth-store";
import type { Message } from "../types/chat";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Chat">;

export function ChatScreen({ route }: Props) {
  const { chatId } = route.params;
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingText, setTypingText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = user?.id ?? "";

  const loadMessages = useCallback(async () => {
    const result = await fetchChatMessages(chatId);
    const sortedMessages = [...result.messages].sort(
      (a, b) =>
        new Date(a.sentAt || a.createdAt).getTime() -
        new Date(b.sentAt || b.createdAt).getTime()
    );

    setMessages(sortedMessages);
  }, [chatId]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadMessages();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadMessages]);

  useEffect(() => {
    socket.emit("join_chat", chatId);

    return () => {
      socket.emit("leave_chat", chatId);
    };
  }, [chatId]);

  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((existing) => existing.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });

      if (message.sender.id !== currentUserId) {
        socket.emit("message_delivered", {
          messageId: message.id,
          chatId,
          recipientId: currentUserId,
        });
        socket.emit("messages_read", {
          chatId,
          readerId: currentUserId,
        });
      }
    };

    const handleMessageUpdated = (updatedMessage: Message) => {
      if (updatedMessage.chatId !== chatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => (message.id === updatedMessage.id ? updatedMessage : message))
      );
    };

    const handleMessageDeleted = (deletedMessage: Message) => {
      if (deletedMessage.chatId !== chatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => (message.id === deletedMessage.id ? deletedMessage : message))
      );
    };

    const handleTyping = (payload: { chatId: string; userId: string; name?: string }) => {
      if (payload.chatId !== chatId || payload.userId === currentUserId) {
        return;
      }

      setTypingText(`${payload.name || "Someone"} is typing...`);
    };

    const handleStopTyping = (payload: { chatId: string; userId: string }) => {
      if (payload.chatId !== chatId || payload.userId === currentUserId) {
        return;
      }

      setTypingText(null);
    };

    const handleDelivered = ({
      messageId,
      recipientId,
    }: {
      messageId: string;
      recipientId: string;
    }) => {
      if (recipientId === currentUserId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId && message.sender.id === currentUserId
            ? { ...message, status: message.status === "READ" ? "READ" : "DELIVERED" }
            : message
        )
      );
    };

    const handleRead = ({
      readerId,
      messageIds,
    }: {
      readerId: string;
      messageIds?: string[];
    }) => {
      if (readerId === currentUserId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.sender.id === currentUserId &&
          (!messageIds || messageIds.includes(message.id))
            ? { ...message, status: "READ" }
            : message
        )
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_delivered", handleDelivered);
    socket.on("messages_read", handleRead);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_delivered", handleDelivered);
      socket.off("messages_read", handleRead);
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!loading && currentUserId) {
      socket.emit("messages_read", {
        chatId,
        readerId: currentUserId,
      });
    }
  }, [chatId, currentUserId, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || sending) {
      return;
    }

    setSending(true);

    try {
      const result = await sendChatMessage(chatId, trimmed);
      setMessages((prev) => [...prev, result.messageData]);
      setInput("");
      socket.emit("stop_typing", {
        chatId,
        userId: currentUserId,
      });
    } finally {
      setSending(false);
    }
  };

  const handleChangeText = (text: string) => {
    setInput(text);

    if (!currentUserId) {
      return;
    }

    socket.emit("typing", {
      chatId,
      userId: currentUserId,
      name: user?.firstName,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        chatId,
        userId: currentUserId,
      });
    }, 1200);
  };

  const data = useMemo(() => [...messages], [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.sender.id === currentUserId} />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading messages...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet.</Text>
            </View>
          )
        }
      />
      <View style={styles.composerShell}>
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{typingText || " "}</Text>
        </View>
        <View style={styles.composerRow}>
          <TextInput
            value={input}
            onChangeText={handleChangeText}
            placeholder="Message"
            placeholderTextColor="#64748b"
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[
              styles.sendButton,
              sending || !input.trim() ? styles.sendButtonDisabled : null,
            ]}
          >
            <Text style={styles.sendButtonText}>{sending ? "..." : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  listContent: {
    padding: 16,
    paddingBottom: 12,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  composerShell: {
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  typingRow: {
    minHeight: 20,
    justifyContent: "center",
  },
  typingText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: "#111827",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  sendButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
