import { StyleSheet, Text, View } from "react-native";

type InlineMessageProps = {
  text: string;
  tone?: "error" | "success" | "info";
};

export function InlineMessage({ text, tone = "info" }: InlineMessageProps) {
  return (
    <View
      style={[
        styles.container,
        tone === "error" ? styles.error : tone === "success" ? styles.success : styles.info,
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  error: {
    backgroundColor: "rgba(127, 29, 29, 0.35)",
    borderColor: "#7f1d1d",
  },
  success: {
    backgroundColor: "rgba(20, 83, 45, 0.35)",
    borderColor: "#14532d",
  },
  info: {
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderColor: "#334155",
  },
  text: {
    color: "#e2e8f0",
    fontSize: 14,
  },
});
