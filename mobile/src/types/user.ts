export type User = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  username: string;
  email: string;
  profilePhotoUrl?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
