import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    marginTop: 8,
  },
  body: {
    marginTop: 24,
    gap: 14,
  },
});
