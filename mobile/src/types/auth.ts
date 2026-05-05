import type { User } from "./user";

export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};

export type RegisterResponse = {
  message: string;
  user: User;
  verificationUrl?: string;
};

export type MeResponse = {
  message: string;
  user: User;
};
