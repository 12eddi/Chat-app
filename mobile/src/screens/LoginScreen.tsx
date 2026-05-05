import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthCard } from "../components/AuthCard";
import { Button, Field } from "../components/FormControls";
import { InlineMessage } from "../components/InlineMessage";
import { Screen } from "../components/Screen";
import { useAuthStore } from "../state/auth-store";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    clearError();

    try {
      await login(identifier.trim(), password);
    } catch (error: any) {
      if (!error?.response?.data?.message) {
        Alert.alert("Login failed", "Please try again.");
      }
    }
  };

  return (
    <Screen scroll>
      <AuthCard title="Welcome back" subtitle="Log in with your existing chat account.">
        {error ? <InlineMessage text={error} tone="error" /> : null}
        <Field
          label="Email or username"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button title="Log in" onPress={handleLogin} loading={isSubmitting} />
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>No account yet? Create one</Text>
        </Pressable>
      </AuthCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkText: {
    marginTop: 6,
    textAlign: "center",
    color: "#a78bfa",
    fontWeight: "700",
  },
});
