import { api } from "./http";

export async function storeDeviceToken(token: string, platform: string) {
  const { data } = await api.post("/api/users/device-token", {
    token,
    platform,
  });

  return data;
}
