import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../state/auth-store";
import { ChatsListScreen } from "../screens/ChatsListScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import type { AppStackParamList, AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

const screenOptions = {
  headerStyle: {
    backgroundColor: "#0f172a",
  },
  headerTintColor: "#e2e8f0",
  headerTitleStyle: {
    fontWeight: "700" as const,
  },
  contentStyle: {
    backgroundColor: "#020617",
  },
};

function ProfileButton() {
  return (
    <Pressable
      onPress={() => navigationRef.navigate("Profile")}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Text style={{ color: "#cbd5e1", fontWeight: "700" }}>Profile</Text>
    </Pressable>
  );
}

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={screenOptions}>
      <AppStack.Screen
        name="Chats"
        component={ChatsListScreen}
        options={{
          title: "Chats",
          headerRight: () => <ProfileButton />,
        }}
      />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.title,
        })}
      />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </AppStack.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const navigationTheme = useMemo(
    () => ({
      dark: true,
      colors: {
        primary: "#8b5cf6",
        background: "#020617",
        card: "#0f172a",
        text: "#e2e8f0",
        border: "#1e293b",
        notification: "#ec4899",
      },
      fonts: {
        regular: { fontFamily: "System", fontWeight: "400" as const },
        medium: { fontFamily: "System", fontWeight: "500" as const },
        bold: { fontFamily: "System", fontWeight: "700" as const },
        heavy: { fontFamily: "System", fontWeight: "800" as const },
      },
    }),
    []
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <View style={{ flex: 1 }}>{token ? <AppStackNavigator /> : <AuthStackNavigator />}</View>
    </NavigationContainer>
  );
}
