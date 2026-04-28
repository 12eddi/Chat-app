import bcrypt from "bcrypt";
import prisma from "../../config/prisma";

type UpdateProfileInput = {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export const searchUsers = async (query: string, currentUserId: string) => {
  return prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        {
          NOT: {
            id: currentUserId,
          },
        },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      profilePhotoUrl: true,
    },
    take: 20,
  });
};

export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      username: true,
      email: true,
      profilePhotoUrl: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateProfile = async ({
  userId,
  firstName,
  lastName,
  username,
  email,
}: UpdateProfileInput) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      AND: [
        {
          OR: [{ username }, { email }],
        },
        {
          NOT: { id: userId },
        },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new Error("Username is already taken");
    }

    if (existingUser.email === email) {
      throw new Error("Email is already taken");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      username,
      email,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      birthDate: true,
      profilePhotoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.passwordHash) {
    throw new Error("Password change is unavailable for Google-only accounts");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
    },
  });

  return { message: "Password changed successfully" };
};
