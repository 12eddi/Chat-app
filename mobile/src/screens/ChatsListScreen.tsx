import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchChats } from "../api/chats";
import { ChatListItem, getChatDisplayTitle, getChatOtherUser } from "../components/ChatListItem";
import { Screen } from "../components/Screen";
import { socket } from "../socket/client";
import { useAuthStore } from "../state/auth-store";
import type { Chat } from "../types/chat";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Chats">;

export function ChatsListScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = user?.id ?? "";

  const loadChats = useCallback(async () => {
    const result = await fetchChats();
    setChats(result.chats);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadChats();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadChats]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadChats();
    };

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUserIds(userIds);
    };

    socket.on("receive_message", handleRefresh);
    socket.on("chat:updated", handleRefresh);
    socket.on("chat:left", handleRefresh);
    socket.on("message_updated", handleRefresh);
    socket.on("message_deleted", handleRefresh);
    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("receive_message", handleRefresh);
      socket.off("chat:updated", handleRefresh);
      socket.off("chat:left", handleRefresh);
      socket.off("message_updated", handleRefresh);
      socket.off("message_deleted", handleRefresh);
      socket.off("online_users", handleOnlineUsers);
    };
  }, [loadChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadChats();
    } finally {
      setRefreshing(false);
    }
  }, [loadChats]);

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No chats yet</Text>
        <Text style={styles.emptySubtitle}>
          Use your web app to start a conversation, then it will appear here.
        </Text>
      </View>
    ),
    []
  );

  if (!user) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Session missing</Text>
        </View>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.heading}>Your conversations</Text>
            <Text style={styles.subheading}>
              Reuses the existing backend, PostgreSQL, and Socket.IO server.
            </Text>
          </View>
        }
        ListEmptyComponent={emptyState}
        renderItem={({ item }) => {
          const otherUser = getChatOtherUser(item, currentUserId);
          const isOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false;

          return (
            <ChatListItem
              chat={item}
              currentUserId={currentUserId}
              isOnline={isOnline}
              onPress={() =>
                navigation.navigate("Chat", {
                  chatId: item.id,
                  title: getChatDisplayTitle(item, currentUserId),
                })
              }
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 18,
  },
  heading: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  subheading: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
