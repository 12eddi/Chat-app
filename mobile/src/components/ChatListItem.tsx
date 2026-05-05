import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Chat } from "../types/chat";
import type { User } from "../types/user";

type ChatListItemProps = {
  chat: Chat;
  currentUserId: string;
  onPress: () => void;
  isOnline?: boolean;
};

const getChatTitle = (chat: Chat, currentUserId: string) => {
  if (chat.type === "group") {
    return chat.name || "Group chat";
  }

  const partner = chat.participants.find((participant) => participant.userId !== currentUserId)?.user;
  return partner ? `${partner.firstName} ${partner.lastName}`.trim() : "Direct chat";
};

const getChatSubtitle = (chat: Chat, currentUserId: string) => {
  const latestMessage = chat.messages?.[0];

  if (!latestMessage) {
    return chat.type === "group" ? "No messages yet" : "Start the conversation";
  }

  if (latestMessage.imageUrl) {
    return latestMessage.content
      ? `${latestMessage.content} (image)`
      : "Sent an image";
  }

  if (latestMessage.senderId === currentUserId) {
    return `You: ${latestMessage.content}`;
  }

  return latestMessage.content;
};

const getInitials = (chat: Chat, currentUserId: string) => {
  if (chat.type === "group") {
    return (chat.name || "GC")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const partner = chat.participants.find((participant) => participant.userId !== currentUserId)?.user;
  return `${partner?.firstName?.[0] || ""}${partner?.lastName?.[0] || ""}`.trim().toUpperCase() || "DM";
};

export function ChatListItem({ chat, currentUserId, onPress, isOnline = false }: ChatListItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(chat, currentUserId)}</Text>
        {chat.type !== "group" && isOnline ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {getChatTitle(chat, currentUserId)}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {getChatSubtitle(chat, currentUserId)}
        </Text>
      </View>
    </Pressable>
  );
}

export function getChatDisplayTitle(chat: Chat, currentUserId: string) {
  return getChatTitle(chat, currentUserId);
}

export function getChatOtherUser(chat: Chat, currentUserId: string): User | undefined {
  return chat.participants.find((participant) => participant.userId !== currentUserId)?.user;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    position: "absolute",
    right: 1,
    bottom: 1,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
});
