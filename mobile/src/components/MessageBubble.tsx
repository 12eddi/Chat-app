import { Image, StyleSheet, Text, View } from "react-native";
import type { Message } from "../types/chat";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timestamp = new Date(message.sentAt || message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {!isOwn ? <Text style={styles.sender}>{message.sender.firstName}</Text> : null}
        {message.imageUrl ? (
          <Image source={{ uri: message.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}
        {message.content ? (
          <Text style={[styles.content, isOwn ? styles.ownContent : styles.otherContent]}>
            {message.content}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{timestamp}</Text>
          {isOwn ? <Text style={styles.metaText}>{message.status}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    flexDirection: "row",
  },
  wrapperOwn: {
    justifyContent: "flex-end",
  },
  wrapperOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "84%",
    padding: 12,
    borderRadius: 18,
    gap: 8,
  },
  ownBubble: {
    backgroundColor: "#4f46e5",
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: "#111827",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  sender: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownContent: {
    color: "#ffffff",
  },
  otherContent: {
    color: "#e2e8f0",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  metaText: {
    color: "rgba(226, 232, 240, 0.72)",
    fontSize: 11,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: "#0f172a",
  },
});
