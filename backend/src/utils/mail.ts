import * as nodemailer from "nodemailer";
import { env } from "../config/env";

const getSmtpConfig = () => {
  if (!env.mail) {
    return null;
  }

  return {
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  };
};

export const isMailConfigured = () => {
  return Boolean(getSmtpConfig() && env.mail?.from);
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const smtpConfig = getSmtpConfig();
  const from = env.mail?.from;

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

export const sendEmailVerificationEmail = async (
  email: string,
  verificationUrl: string
) => {
  const smtpConfig = getSmtpConfig();
  const from = env.mail?.from;

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
