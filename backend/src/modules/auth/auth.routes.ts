import { Router } from "express";
import {
  register,
  login,
  me,
  forgotPassword,
  completePasswordReset,
  confirmEmailVerification,
  resendVerification,
  googleLogin,
  googleConfig,
} from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { createRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router();

const registerRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 8,
  message: "Too many registration attempts. Please try again later.",
});

const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: "Too many login attempts. Please try again later.",
});

const passwordResetRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many password reset attempts. Please try again later.",
});

const verificationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 6,
  message: "Too many verification attempts. Please try again later.",
});

router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/forgot-password", passwordResetRateLimit, forgotPassword);
router.post("/reset-password", passwordResetRateLimit, completePasswordReset);
router.post("/verify-email", verificationRateLimit, confirmEmailVerification);
router.post("/resend-verification", verificationRateLimit, resendVerification);
router.post("/google", loginRateLimit, googleLogin);
router.get("/google/config", googleConfig);
router.get("/me", authenticate, me);

export default router;
