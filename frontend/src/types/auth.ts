import type { User } from "./user";

export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};

export type RegisterResponse = {
  message: string;
  user: User;
};

export type MeResponse = {
  message: string;
  user: User;
};

export type ForgotPasswordResponse = {
  message: string;
  resetUrl?: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type VerifyEmailResponse = {
  message: string;
};

export type ResendVerificationResponse = {
  message: string;
  verificationUrl?: string;
};

export type GoogleConfigResponse = {
  clientId: string | null;
};
