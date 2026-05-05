import { api } from "./http";
import type { LoginResponse, MeResponse, RegisterResponse } from "../types/auth";

type RegisterPayload = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export async function login(identifier: string, password: string) {
  const { data } = await api.post<LoginResponse>("/api/auth/login", {
    identifier,
    password,
  });

  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/api/auth/register", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get<MeResponse>("/api/auth/me");
  return data;
}
