import axios from "axios";
import { mobileEnv } from "../config/env";
import { getStoredToken } from "../lib/secure-store";

let authToken: string | null = null;

export const api = axios.create({
  baseURL: mobileEnv.apiBaseUrl,
  timeout: 15000,
});

export function setHttpAuthToken(token: string | null) {
  authToken = token;

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function bootstrapHttpAuth() {
  const token = await getStoredToken();
  setHttpAuthToken(token);
  return token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});
