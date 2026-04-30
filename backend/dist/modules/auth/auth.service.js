"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerificationEmail = exports.verifyEmail = exports.resetPassword = exports.requestPasswordReset = exports.loginWithGoogle = exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const mail_1 = require("../../utils/mail");
const google_1 = require("../../utils/google");
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
const createTokenRecord = (ttlMinutes) => {
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    return {
        rawToken,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    };
};
const createPasswordResetToken = () => createTokenRecord(env_1.env.passwordResetTokenTtlMinutes);
const createEmailVerificationToken = () => createTokenRecord(env_1.env.emailVerificationTokenTtlMinutes);
const getPasswordResetUrl = (token) => {
    return `${env_1.env.primaryClientUrl}/forgot-password?token=${encodeURIComponent(token)}`;
};
const getEmailVerificationUrl = (token) => {
    return `${env_1.env.primaryClientUrl}/verify-email?token=${encodeURIComponent(token)}`;
};
const shouldExposeResetUrl = () => {
    return env_1.env.nodeEnv !== "production" && !(0, mail_1.isMailConfigured)();
};
const issueAuthPayload = (user) => {
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.env.jwtSecret, {
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
    await prisma_1.default.$executeRaw `
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT
  `;
    await prisma_1.default.$executeRaw `
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3)
  `;
    passwordResetColumnsReady = true;
};
const ensureEmailVerificationColumns = async () => {
    if (emailVerificationColumnsReady) {
        return;
    }
    await prisma_1.default.$executeRaw `
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailVerificationTokenHash" TEXT
  `;
    await prisma_1.default.$executeRaw `
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3)
  `;
    emailVerificationColumnsReady = true;
};
const issueEmailVerification = async (userId, email) => {
    await ensureEmailVerificationColumns();
    const { rawToken, tokenHash, expiresAt } = createEmailVerificationToken();
    const verificationUrl = getEmailVerificationUrl(rawToken);
    await prisma_1.default.$executeRaw `
    UPDATE "User"
    SET
      "emailVerificationTokenHash" = ${tokenHash},
      "emailVerificationExpiresAt" = ${expiresAt}
    WHERE "id" = ${userId}
  `;
    if ((0, mail_1.isMailConfigured)()) {
        try {
            await (0, mail_1.sendEmailVerificationEmail)(email, verificationUrl);
        }
        catch (error) {
            console.error("Failed to send email verification email:", error);
        }
    }
    return {
        message: "Verification email sent successfully",
        verificationUrl: env_1.env.nodeEnv !== "production" && !(0, mail_1.isMailConfigured)() ? verificationUrl : undefined,
    };
};
const registerUser = async (data) => {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const birthDate = data.birthDate;
    const email = data.email.trim().toLowerCase();
    const username = data.username.trim();
    const password = data.password;
    const existingUser = await prisma_1.default.user.findFirst({
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
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
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
exports.registerUser = registerUser;
const loginUser = async (identifier, password) => {
    const user = await prisma_1.default.user.findFirst({
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
    const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
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
exports.loginUser = loginUser;
const getCurrentUser = async (userId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: userSelect,
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getCurrentUser = getCurrentUser;
const loginWithGoogle = async (idToken) => {
    const googleProfile = await (0, google_1.verifyGoogleIdToken)(idToken);
    const email = googleProfile.email.trim().toLowerCase();
    let user = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ googleId: googleProfile.sub }, { email }],
        },
        select: userSelect,
    });
    if (!user) {
        const emailPrefix = email.split("@")[0] ?? "user";
        const baseUsername = emailPrefix.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
        let usernameCandidate = baseUsername;
        let suffix = 1;
        // Generate a unique username for first-time Google users.
        while (await prisma_1.default.user.findUnique({
            where: { username: usernameCandidate },
            select: { id: true },
        })) {
            usernameCandidate = `${baseUsername.slice(0, 16)}${suffix}`;
            suffix += 1;
        }
        user = await prisma_1.default.user.create({
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
    }
    else {
        user = await prisma_1.default.user.update({
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
exports.loginWithGoogle = loginWithGoogle;
const requestPasswordReset = async (email) => {
    await ensurePasswordResetColumns();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma_1.default.user.findUnique({
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
    await prisma_1.default.$executeRaw `
    UPDATE "User"
    SET
      "passwordResetTokenHash" = ${tokenHash},
      "passwordResetExpiresAt" = ${expiresAt}
    WHERE "id" = ${user.id}
  `;
    if ((0, mail_1.isMailConfigured)()) {
        try {
            await (0, mail_1.sendPasswordResetEmail)(user.email, resetUrl);
        }
        catch (error) {
            console.error("Failed to send password reset email:", error);
        }
    }
    return {
        message: "If this email exists, a reset link has been sent.",
        resetUrl: shouldExposeResetUrl() ? resetUrl : undefined,
    };
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (token, newPassword) => {
    await ensurePasswordResetColumns();
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const users = await prisma_1.default.$queryRaw `
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
    const newPasswordHash = await bcrypt_1.default.hash(newPassword, 10);
    await prisma_1.default.$executeRaw `
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
exports.resetPassword = resetPassword;
const verifyEmail = async (token) => {
    await ensureEmailVerificationColumns();
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const users = await prisma_1.default.$queryRaw `
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
    await prisma_1.default.$executeRaw `
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
exports.verifyEmail = verifyEmail;
const resendVerificationEmail = async (email) => {
    await ensureEmailVerificationColumns();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma_1.default.user.findUnique({
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
exports.resendVerificationEmail = resendVerificationEmail;
//# sourceMappingURL=auth.service.js.map