import type { User } from "./user";

export type ChatParticipant = {
  id: string;
  chatId: string;
  userId: string;
  role: "MEMBER" | "ADMIN" | "OWNER";
  joinedAt: string;
  user: User;
};

export type GroupInvite = {
  id: string;
  chatId: string;
  userId: string;
  invitedById: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user?: Pick<
    User,
    "id" | "firstName" | "lastName" | "username" | "email" | "profilePhotoUrl"
  >;
  invitedBy?: Pick<
    User,
    "id" | "firstName" | "lastName" | "username" | "profilePhotoUrl"
  >;
  chat?: {
    id: string;
    name?: string | null;
    type: string;
  };
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
  sender: Pick<
    User,
    "id" | "firstName" | "lastName" | "username" | "profilePhotoUrl"
  >;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    createdAt: string;
    user: Pick<
      User,
      "id" | "firstName" | "lastName" | "username" | "profilePhotoUrl"
    >;
  }>;
};

export type Chat = {
  id: string;
  type: "direct" | "group" | string;
  name?: string | null;
  photoUrl?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: Pick<User, "id" | "firstName" | "lastName" | "username"> | null;
  participants: ChatParticipant[];
  invites?: GroupInvite[];
  messages?: Message[];
};
