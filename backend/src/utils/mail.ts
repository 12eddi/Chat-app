import * as nodemailer from "nodemailer";
import { env } from "../config/env";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  auth: {
    user: string;
    pass: string;
  };
};

const createSmtpConfig = (port: number): SmtpConfig => {
  return {
    host: env.mail!.host,
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: env.mail!.user,
      pass: env.mail!.pass,
    },
  };
};

const getSmtpConfigs = () => {
  if (!env.mail) {
    return [] as SmtpConfig[];
  }

  const configs = [createSmtpConfig(env.mail.port)];

  if (env.mail.host === "smtp.gmail.com") {
    const fallbackPort = env.mail.port === 465 ? 587 : 465;
    configs.push(createSmtpConfig(fallbackPort));
  }

  return configs;
};

export const isMailConfigured = () => {
  return getSmtpConfigs().length > 0 && Boolean(env.mail?.from);
};

const sendMail = async (options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const configs = getSmtpConfigs();
  const from = env.mail?.from;

  if (!configs.length || !from) {
    return false;
  }

  let lastError: unknown;

  for (const config of configs) {
    try {
      const transporter = nodemailer.createTransport(config);

      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return true;
    } catch (error) {
      lastError = error;
      console.error(
        `SMTP send failed via ${config.host}:${config.port}${config.secure ? " (secure)" : ""}:`,
        error
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Email sending failed");
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const subject = "Reset your password";
  const text = `You requested a password reset.\n\nOpen this link to set a new password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
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
    `;

  return sendMail({
    to: email,
    subject,
    text,
    html,
  });
};

export const sendEmailVerificationEmail = async (
  email: string,
  verificationUrl: string
) => {
  const subject = "Verify your email address";
  const text = `Welcome to Chat App.\n\nOpen this link to verify your email:\n${verificationUrl}\n\nIf you did not create this account, you can ignore this email.`;
  const html = `
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
    `;

  return sendMail({
    to: email,
    subject,
    text,
    html,
  });
};
