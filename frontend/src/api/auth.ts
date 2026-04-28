import api from "./axios";
import type {
  ForgotPasswordResponse,
  LoginResponse,
  MeResponse,
  ResendVerificationResponse,
  RegisterResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  GoogleConfigResponse,
} from "../types/auth";

export const loginRequest = async (identifier: string, password: string) => {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    identifier,
    password,
  });
  return data;
};

export const registerRequest = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}) => {
  const { data } = await api.post<RegisterResponse>("/auth/register", payload);
  return data;
};

export const meRequest = async () => {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
};

export const forgotPasswordRequest = async (email: string) => {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", {
    email,
  });
  return data;
};

export const resetPasswordRequest = async (token: string, password: string) => {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password", {
    token,
    password,
  });
  return data;
};

export const verifyEmailRequest = async (token: string) => {
  const { data } = await api.post<VerifyEmailResponse>("/auth/verify-email", {
    token,
  });
  return data;
};

export const resendVerificationRequest = async (email: string) => {
  const { data } = await api.post<ResendVerificationResponse>(
    "/auth/resend-verification",
    { email }
  );
  return data;
};

export const googleLoginRequest = async (idToken: string) => {
  const { data } = await api.post<LoginResponse>("/auth/google", {
    idToken,
  });
  return data;
};

export const getGoogleConfigRequest = async () => {
  const { data } = await api.get<GoogleConfigResponse>("/auth/google/config");
  return data;
};
