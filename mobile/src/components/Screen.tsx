import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = false }: ScreenProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
});
