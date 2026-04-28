import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  resendVerificationEmail,
  verifyEmail,
  loginWithGoogle,
} from "./auth.service";
import { env } from "../../config/env";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      message: "User created",
      user,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    const result = await loginUser(identifier, password);

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({
      message: "Current user fetched successfully",
      user,
    });
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await requestPasswordReset(email);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const completePasswordReset = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await resetPassword(token, password);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const confirmEmailVerification = async (req: Request, res: Response) => {
  try {
    const { token } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const result = await verifyEmail(token);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await resendVerificationEmail(email);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        message: "Google idToken is required",
      });
    }

    const result = await loginWithGoogle(idToken);

    return res.status(200).json({
      message: "Google login successful",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Google login failed",
    });
  }
};

export const googleConfig = (_req: Request, res: Response) => {
  return res.status(200).json({
    clientId: env.googleClientId,
  });
};
