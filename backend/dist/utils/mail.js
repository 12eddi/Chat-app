"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailVerificationEmailSafely = exports.sendPasswordResetEmailSafely = exports.sendEmailVerificationEmail = exports.sendPasswordResetEmail = exports.isMailConfigured = void 0;
const nodemailer = __importStar(require("nodemailer"));
const env_1 = require("../config/env");
const getSmtpConfig = () => {
    if (!env_1.env.mail) {
        return null;
    }
    return {
        host: env_1.env.mail.host,
        port: env_1.env.mail.port,
        secure: env_1.env.mail.port === 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: env_1.env.mail.user,
            pass: env_1.env.mail.pass,
        },
    };
};
const isMailConfigured = () => {
    return Boolean(getSmtpConfig() && env_1.env.mail?.from);
};
exports.isMailConfigured = isMailConfigured;
const sendPasswordResetEmail = async (email, resetUrl) => {
    const smtpConfig = getSmtpConfig();
    const from = env_1.env.mail?.from;
    if (!smtpConfig || !from) {
        return false;
    }
    const transporter = nodemailer.createTransport(smtpConfig);
    await transporter.sendMail({
        from,
        to: email,
        subject: "Reset your password",
        text: `You requested a password reset.\n\nOpen this link to set a new password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>You requested a password reset for your chat app account.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;"
          >
            Reset password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    });
    return true;
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendEmailVerificationEmail = async (email, verificationUrl) => {
    const smtpConfig = getSmtpConfig();
    const from = env_1.env.mail?.from;
    if (!smtpConfig || !from) {
        return false;
    }
    const transporter = nodemailer.createTransport(smtpConfig);
    await transporter.sendMail({
        from,
        to: email,
        subject: "Verify your email address",
        text: `Welcome to Chat App.\n\nOpen this link to verify your email:\n${verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
        html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Verify your email</h2>
        <p>Welcome to Chat App. Please confirm your email address to complete your account setup.</p>
        <p>
          <a
            href="${verificationUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;"
          >
            Verify email
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
    });
    return true;
};
exports.sendEmailVerificationEmail = sendEmailVerificationEmail;
const sendPasswordResetEmailSafely = async (email, resetUrl) => {
    try {
        await (0, exports.sendPasswordResetEmail)(email, resetUrl);
        return true;
    }
    catch (error) {
        console.error("Failed to send password reset email:", error);
        return false;
    }
};
exports.sendPasswordResetEmailSafely = sendPasswordResetEmailSafely;
const sendEmailVerificationEmailSafely = async (email, verificationUrl) => {
    try {
        await (0, exports.sendEmailVerificationEmail)(email, verificationUrl);
        return true;
    }
    catch (error) {
        console.error("Failed to send email verification email:", error);
        return false;
    }
};
exports.sendEmailVerificationEmailSafely = sendEmailVerificationEmailSafely;
//# sourceMappingURL=mail.js.map