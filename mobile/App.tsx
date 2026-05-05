import "react-native-gesture-handler";
import "react-native-reanimated";

import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { bootstrapHttpAuth } from "./src/api/http";
import { usePushNotifications } from "./src/hooks/use-push-notifications";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/state/auth-store";

function AppBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrateSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    bootstrapHttpAuth();
    void hydrate();
  }, [hydrate]);

  usePushNotifications({
    token,
    userId: user?.id ?? null,
  });

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppBootstrap />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
});
