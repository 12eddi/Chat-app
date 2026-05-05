import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthCard } from "../components/AuthCard";
import { Button, Field } from "../components/FormControls";
import { InlineMessage } from "../components/InlineMessage";
import { Screen } from "../components/Screen";
import { useAuthStore } from "../state/auth-store";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    clearError();
    setSuccessMessage(null);

    try {
      const result = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const extra = result.verificationUrl
        ? `\n\nVerification link:\n${result.verificationUrl}`
        : "";
      const message = `Account created. You can now sign in.${extra}`;

      setSuccessMessage(message);
      Alert.alert("Registration successful", message);
      navigation.navigate("Login");
    } catch (error: any) {
      if (!error?.response?.data?.message) {
        Alert.alert("Registration failed", "Please try again.");
      }
    }
  };

  return (
    <Screen scroll>
      <AuthCard
        title="Create account"
        subtitle="Use the same backend and database as the web app."
      >
        {error ? <InlineMessage text={error} tone="error" /> : null}
        {successMessage ? <InlineMessage text={successMessage} tone="success" /> : null}
        <Field label="First name" value={firstName} onChangeText={setFirstName} />
        <Field label="Last name" value={lastName} onChangeText={setLastName} />
        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button title="Create account" onPress={handleRegister} loading={isSubmitting} />
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
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
