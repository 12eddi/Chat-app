"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const DEFAULT_CLIENT_URL = "http://localhost:5173";
const DEFAULT_PORT = 5000;
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;
const DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = 60;
const DEFAULT_SCHEDULED_MESSAGE_POLL_MS = 5000;
const DEFAULT_SCHEDULED_MESSAGE_BATCH_SIZE = 20;
const DEFAULT_SCHEDULED_MESSAGE_ERROR_BACKOFF_MS = 15000;
const requireString = (value, name) => {
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
};
const parseNumber = (value, fallback, name) => {
    if (value === undefined || value === "") {
        return fallback;
    }
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsedValue;
};
const parsePositiveInteger = (value, fallback, name) => {
    const parsedValue = parseNumber(value, fallback, name);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer`);
    }
    return parsedValue;
};
const parseBoolean = (value, fallback) => {
    if (value === undefined || value === "") {
        return fallback;
    }
    const normalizedValue = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalizedValue)) {
        return true;
    }
    if (["0", "false", "no", "off"].includes(normalizedValue)) {
        return false;
    }
    throw new Error("Environment variable value must be a boolean-like string: true/false, 1/0, yes/no, on/off");
};
const databaseUrl = requireString(process.env.DATABASE_URL, "DATABASE_URL");
const jwtSecret = requireString(process.env.JWT_SECRET, "JWT_SECRET");
const rawClientUrl = process.env.CLIENT_URL?.trim() || DEFAULT_CLIENT_URL;
const clientUrls = rawClientUrl
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
const primaryClientUrl = clientUrls[0] || DEFAULT_CLIENT_URL;
const host = process.env.HOST?.trim() || DEFAULT_HOST;
const port = parsePositiveInteger(process.env.PORT, DEFAULT_PORT, "PORT");
const passwordResetTokenTtlMinutes = parsePositiveInteger(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES, "PASSWORD_RESET_TOKEN_TTL_MINUTES");
const emailVerificationTokenTtlMinutes = parsePositiveInteger(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES, DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES, "EMAIL_VERIFICATION_TOKEN_TTL_MINUTES");
const scheduledMessagePollMs = parsePositiveInteger(process.env.SCHEDULED_MESSAGE_POLL_MS, DEFAULT_SCHEDULED_MESSAGE_POLL_MS, "SCHEDULED_MESSAGE_POLL_MS");
const scheduledMessageBatchSize = parsePositiveInteger(process.env.SCHEDULED_MESSAGE_BATCH_SIZE, DEFAULT_SCHEDULED_MESSAGE_BATCH_SIZE, "SCHEDULED_MESSAGE_BATCH_SIZE");
const scheduledMessageErrorBackoffMs = parsePositiveInteger(process.env.SCHEDULED_MESSAGE_ERROR_BACKOFF_MS, DEFAULT_SCHEDULED_MESSAGE_ERROR_BACKOFF_MS, "SCHEDULED_MESSAGE_ERROR_BACKOFF_MS");
const runScheduledMessageProcessor = parseBoolean(process.env.RUN_SCHEDULED_MESSAGE_PROCESSOR, true);
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPortValue = process.env.SMTP_PORT?.trim();
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const mailFrom = process.env.MAIL_FROM?.trim();
const hasAnyMailSetting = Boolean(smtpHost || smtpPortValue || smtpUser || smtpPass || mailFrom);
const hasAllMailSettings = Boolean(smtpHost && smtpPortValue && smtpUser && smtpPass && mailFrom);
if (hasAnyMailSetting && !hasAllMailSettings) {
    throw new Error("Mail configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM together.");
}
const smtpPort = hasAllMailSettings
    ? parsePositiveInteger(smtpPortValue, 0, "SMTP_PORT")
    : null;
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || null;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const firebasePrivateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim();
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
const hasAnyCloudinarySetting = Boolean(cloudinaryCloudName || cloudinaryApiKey || cloudinaryApiSecret);
const hasAllCloudinarySettings = Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret);
if (hasAnyCloudinarySetting && !hasAllCloudinarySettings) {
    throw new Error("Cloudinary configuration is incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET together.");
}
const hasAnyFirebaseTriplet = Boolean(firebaseProjectId || firebaseClientEmail || firebasePrivateKeyRaw);
const hasAllFirebaseTriplet = Boolean(firebaseProjectId && firebaseClientEmail && firebasePrivateKeyRaw);
if (hasAnyFirebaseTriplet && !hasAllFirebaseTriplet) {
    throw new Error("Firebase Admin configuration is incomplete. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY together.");
}
if (firebaseServiceAccountJson && hasAnyFirebaseTriplet) {
    throw new Error("Use either FIREBASE_SERVICE_ACCOUNT_JSON or the FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY triplet, not both.");
}
const firebasePrivateKey = firebasePrivateKeyRaw?.replace(/\\n/g, "\n");
exports.env = {
    nodeEnv: process.env.NODE_ENV || "development",
    host,
    port,
    clientUrl: rawClientUrl,
    clientUrls,
    primaryClientUrl,
    databaseUrl,
    jwtSecret,
    passwordResetTokenTtlMinutes,
    emailVerificationTokenTtlMinutes,
    scheduledMessagePollMs,
    scheduledMessageBatchSize,
    scheduledMessageErrorBackoffMs,
    runScheduledMessageProcessor,
    googleClientId,
    firebase: firebaseServiceAccountJson
        ? {
            serviceAccountJson: firebaseServiceAccountJson,
        }
        : hasAllFirebaseTriplet
            ? {
                projectId: firebaseProjectId,
                clientEmail: firebaseClientEmail,
                privateKey: firebasePrivateKey,
            }
            : null,
    cloudinary: hasAllCloudinarySettings
        ? {
            cloudName: cloudinaryCloudName,
            apiKey: cloudinaryApiKey,
            apiSecret: cloudinaryApiSecret,
        }
        : null,
    mail: hasAllMailSettings && smtpPort
        ? {
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            pass: smtpPass,
            from: mailFrom,
        }
        : null,
};
//# sourceMappingURL=env.js.map