"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
const registerRateLimit = (0, rate_limit_middleware_1.createRateLimit)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 8,
    message: "Too many registration attempts. Please try again later.",
});
const loginRateLimit = (0, rate_limit_middleware_1.createRateLimit)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: "Too many login attempts. Please try again later.",
});
const passwordResetRateLimit = (0, rate_limit_middleware_1.createRateLimit)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 25,
    message: "Too many password reset attempts. Please try again later.",
});
const verificationRateLimit = (0, rate_limit_middleware_1.createRateLimit)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    message: "Too many verification attempts. Please try again later.",
});
router.post("/register", registerRateLimit, auth_controller_1.register);
router.post("/login", loginRateLimit, auth_controller_1.login);
router.post("/forgot-password", passwordResetRateLimit, auth_controller_1.forgotPassword);
router.post("/reset-password", passwordResetRateLimit, auth_controller_1.completePasswordReset);
router.post("/verify-email", verificationRateLimit, auth_controller_1.confirmEmailVerification);
router.post("/resend-verification", verificationRateLimit, auth_controller_1.resendVerification);
router.post("/google", loginRateLimit, auth_controller_1.googleLogin);
router.get("/google/config", auth_controller_1.googleConfig);
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map