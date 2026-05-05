const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || apiBaseUrl || "";

if (!apiBaseUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Add it to mobile/.env or your build environment."
  );
}

export const mobileEnv = {
  apiBaseUrl,
  socketUrl,
};
