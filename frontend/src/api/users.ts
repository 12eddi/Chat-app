import api from "./axios";
import type { User } from "../types/user";

export const searchUsersRequest = async (query: string) => {
  const { data } = await api.get<{ users: User[] }>("/users", {
    params: { query },
  });
  return data;
};

export const getUserDetailsRequest = async (userId: string) => {
  const { data } = await api.get<{ user: User }>(`/users/${userId}`);
  return data;
};

export const updateProfileRequest = async (payload: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}) => {
  const { data } = await api.put<{ message: string; user: User }>(
    "/users/profile",
    payload
  );
  return data;
};

export const uploadPhotoRequest = async (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);

  const { data } = await api.post("/users/upload-photo", formData);

  return data;
};

export const changePasswordRequest = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data } = await api.put<{ message: string }>(
    "/users/change-password",
    payload
  );
  return data;
};
