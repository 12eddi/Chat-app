import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "chat-app-mobile-auth-token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearStoredToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
