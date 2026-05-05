import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components/FormControls";
import { Screen } from "../components/Screen";
import { useAuthStore } from "../state/auth-store";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : "Unknown user"}
        </Text>
        <Text style={styles.username}>@{user?.username || "unknown"}</Text>

        <View style={styles.metaGroup}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValue}>{user?.email || "—"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Verified</Text>
            <Text style={styles.metaValue}>{user?.emailVerified ? "Yes" : "No"}</Text>
          </View>
        </View>

        <Text style={styles.note}>
          This mobile client reuses your existing backend auth, chats, and realtime server.
        </Text>

        <Button title="Log out" onPress={() => void logout()} variant="danger" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 18,
  },
  name: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  username: {
    color: "#a78bfa",
    fontSize: 16,
    fontWeight: "700",
  },
  metaGroup: {
    gap: 12,
  },
  metaRow: {
    gap: 4,
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    color: "#94a3b8",
    lineHeight: 21,
  },
});
