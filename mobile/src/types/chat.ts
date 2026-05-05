import type { User } from "./user";

export type ChatParticipant = {
  id: string;
  chatId: string;
  userId: string;
  role: "MEMBER" | "ADMIN" | "OWNER";
  joinedAt: string;
  user: User;
};

export type MessageReaction = {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
  user: Pick<User, "id" | "firstName" | "lastName" | "username" | "profilePhotoUrl">;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  imageUrl?: string | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sender: Pick<User, "id" | "firstName" | "lastName" | "username" | "profilePhotoUrl">;
  reactions?: MessageReaction[];
};

export type Chat = {
  id: string;
  type: "direct" | "group" | string;
  name?: string | null;
  photoUrl?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages?: Message[];
};
