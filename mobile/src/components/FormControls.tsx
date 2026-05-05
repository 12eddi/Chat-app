import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  multiline?: boolean;
};

export function Field(props: InputProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        style={[styles.input, props.multiline ? styles.multilineInput : null]}
        placeholderTextColor="#64748b"
      />
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ title, onPress, loading, variant = "primary" }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        variant === "secondary"
          ? styles.secondaryButton
          : variant === "danger"
          ? styles.dangerButton
          : styles.primaryButton,
        loading ? styles.buttonDisabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "secondary" ? styles.secondaryButtonText : null,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    gap: 8,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#8b5cf6",
  },
  secondaryButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
  },
  dangerButton: {
    backgroundColor: "#dc2626",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
  },
});
