import prisma from "../../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import {
  isMailConfigured,
  sendEmailVerificationEmailSafely,
  sendPasswordResetEmailSafely,
} from "../../utils/mail";
import { verifyGoogleIdToken } from "../../utils/google";

type RegisterInput = {
  firstName: string;
  lastName: string;
  birthDate?: string;
  email: string;
  username: string;
  password: string;
};

const userSelect = {
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
};

const createTokenRecord = (ttlMinutes: number) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    tokenHash,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  };
};

const createPasswordResetToken = () =>
  createTokenRecord(env.passwordResetTokenTtlMinutes);

const createEmailVerificationToken = () =>
  createTokenRecord(env.emailVerificationTokenTtlMinutes);

const getPasswordResetUrl = (token: string) => {
  return `${env.clientUrl}/forgot-password?token=${encodeURIComponent(token)}`;
};

const getEmailVerificationUrl = (token: string) => {
  return `${env.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

const shouldExposeResetUrl = () => {
  return env.nodeEnv !== "production" && !isMailConfigured();
};

const issueAuthPayload = (user: {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  username: string;
  email: string;
  profilePhotoUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "7d",
  });

  return {
    token,
    user,
  };
};

let passwordResetColumnsReady = false;
let emailVerificationColumnsReady = false;

const ensurePasswordResetColumns = async () => {
  if (passwordResetColumnsReady) {
    return;
  }

  await prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT
  `;

  await prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3)
  `;

  passwordResetColumnsReady = true;
};

const ensureEmailVerificationColumns = async () => {
  if (emailVerificationColumnsReady) {
    return;
  }

  await prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailVerificationTokenHash" TEXT
  `;

  await prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3)
  `;

  emailVerificationColumnsReady = true;
};

const issueEmailVerification = async (userId: string, email: string) => {
  await ensureEmailVerificationColumns();

  const { rawToken, tokenHash, expiresAt } = createEmailVerificationToken();
  const verificationUrl = getEmailVerificationUrl(rawToken);

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "emailVerificationTokenHash" = ${tokenHash},
      "emailVerificationExpiresAt" = ${expiresAt}
    WHERE "id" = ${userId}
  `;

  if (isMailConfigured()) {
    await sendEmailVerificationEmailSafely(email, verificationUrl);
  }

  return {
    message: "Verification email sent successfully",
    verificationUrl:
      env.nodeEnv !== "production" && !isMailConfigured() ? verificationUrl : undefined,
  };
};

export const registerUser = async (data: RegisterInput) => {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const birthDate = data.birthDate;
  const email = data.email.trim().toLowerCase();
  const username = data.username.trim();
  const password = data.password;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("Email is already taken");
    }

    if (existingUser.username === username) {
      throw new Error("Username is already taken");
    }

    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      birthDate: birthDate ? new Date(birthDate) : null,
      email,
      username,
      passwordHash: hashedPassword,
    },
    select: userSelect,
  });

  await issueEmailVerification(user.id, user.email);

  return user;
};

export const loginUser = async (identifier: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.passwordHash) {
    throw new Error("Use Google sign-in for this account");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return issueAuthPayload({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate,
    username: user.username,
    email: user.email,
    profilePhotoUrl: user.profilePhotoUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const loginWithGoogle = async (idToken: string) => {
  const googleProfile = await verifyGoogleIdToken(idToken);
  const email = googleProfile.email.trim().toLowerCase();

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: googleProfile.sub }, { email }],
    },
    select: userSelect,
  });

  if (!user) {
    const emailPrefix = email.split("@")[0] ?? "user";
    const baseUsername =
      emailPrefix.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
    let usernameCandidate = baseUsername;
    let suffix = 1;

    // Generate a unique username for first-time Google users.
    while (
      await prisma.user.findUnique({
        where: { username: usernameCandidate },
        select: { id: true },
      })
    ) {
      usernameCandidate = `${baseUsername.slice(0, 16)}${suffix}`;
      suffix += 1;
    }

    user = await prisma.user.create({
      data: {
        firstName: googleProfile.given_name?.trim() || "Google",
        lastName: googleProfile.family_name?.trim() || "User",
        email,
        username: usernameCandidate,
        googleId: googleProfile.sub,
        profilePhotoUrl: googleProfile.picture || null,
        emailVerified: true,
      },
      select: userSelect,
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleProfile.sub,
        emailVerified: true,
        profilePhotoUrl: user.profilePhotoUrl || googleProfile.picture || null,
      },
      select: userSelect,
    });
  }

  return issueAuthPayload(user);
};

export const requestPasswordReset = async (email: string) => {
  await ensurePasswordResetColumns();

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return {
      message: "If this email exists, a reset link has been sent.",
    };
  }

  const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
  const resetUrl = getPasswordResetUrl(rawToken);

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "passwordResetTokenHash" = ${tokenHash},
      "passwordResetExpiresAt" = ${expiresAt}
    WHERE "id" = ${user.id}
  `;

  if (isMailConfigured()) {
    await sendPasswordResetEmailSafely(user.email, resetUrl);
  }

  return {
    message: "If this email exists, a reset link has been sent.",
    resetUrl: shouldExposeResetUrl() ? resetUrl : undefined,
  };
};

export const resetPassword = async (token: string, newPassword: string) => {
  await ensurePasswordResetColumns();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const users = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "User"
    WHERE
      "passwordResetTokenHash" = ${tokenHash}
      AND "passwordResetExpiresAt" > ${new Date()}
    LIMIT 1
  `;

  const user = users[0];

  if (!user) {
    throw new Error("Reset link is invalid or has expired");
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "passwordHash" = ${newPasswordHash},
      "passwordResetTokenHash" = NULL,
      "passwordResetExpiresAt" = NULL
    WHERE "id" = ${user.id}
  `;

  return {
    message: "Password reset successful",
  };
};

export const verifyEmail = async (token: string) => {
  await ensureEmailVerificationColumns();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const users = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "User"
    WHERE
      "emailVerificationTokenHash" = ${tokenHash}
      AND "emailVerificationExpiresAt" > ${new Date()}
      AND "emailVerified" = false
    LIMIT 1
  `;

  const user = users[0];

  if (!user) {
    throw new Error("Verification link is invalid or has expired");
  }

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "emailVerified" = true,
      "emailVerificationTokenHash" = NULL,
      "emailVerificationExpiresAt" = NULL
    WHERE "id" = ${user.id}
  `;

  return {
    message: "Email verified successfully",
  };
};

export const resendVerificationEmail = async (email: string) => {
  await ensureEmailVerificationColumns();

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return {
      message: "If this email exists, a verification email has been sent.",
    };
  }

  if (user.emailVerified) {
    return {
      message: "This email is already verified.",
    };
  }

  const result = await issueEmailVerification(user.id, user.email);

  return {
    message: "If this email exists, a verification email has been sent.",
    verificationUrl: result.verificationUrl,
  };
};
