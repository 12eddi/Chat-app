"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleConfig = exports.googleLogin = exports.resendVerification = exports.confirmEmailVerification = exports.completePasswordReset = exports.forgotPassword = exports.me = exports.login = exports.register = void 0;
const auth_service_1 = require("./auth.service");
const env_1 = require("../../config/env");
const register = async (req, res) => {
    try {
        const user = await (0, auth_service_1.registerUser)(req.body);
        res.status(201).json({
            message: "User created",
            user,
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const result = await (0, auth_service_1.loginUser)(identifier, password);
        res.status(200).json({
            message: "Login successful",
            ...result,
        });
    }
    catch (error) {
        res.status(401).json({
            message: error.message,
        });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await (0, auth_service_1.getCurrentUser)(req.user.id);
        res.status(200).json({
            message: "Current user fetched successfully",
            user,
        });
    }
    catch (error) {
        res.status(404).json({
            message: error.message,
        });
    }
};
exports.me = me;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({
                message: "Email is required",
            });
        }
        const result = await (0, auth_service_1.requestPasswordReset)(email);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.forgotPassword = forgotPassword;
const completePasswordReset = async (req, res) => {
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
        const result = await (0, auth_service_1.resetPassword)(token, password);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.completePasswordReset = completePasswordReset;
const confirmEmailVerification = async (req, res) => {
    try {
        const { token } = req.body || {};
        if (!token || typeof token !== "string") {
            return res.status(400).json({
                message: "Verification token is required",
            });
        }
        const result = await (0, auth_service_1.verifyEmail)(token);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.confirmEmailVerification = confirmEmailVerification;
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({
                message: "Email is required",
            });
        }
        const result = await (0, auth_service_1.resendVerificationEmail)(email);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
exports.resendVerification = resendVerification;
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body || {};
        if (!idToken || typeof idToken !== "string") {
            return res.status(400).json({
                message: "Google idToken is required",
            });
        }
        const result = await (0, auth_service_1.loginWithGoogle)(idToken);
        return res.status(200).json({
            message: "Google login successful",
            ...result,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Google login failed",
        });
    }
};
exports.googleLogin = googleLogin;
const googleConfig = (_req, res) => {
    return res.status(200).json({
        clientId: env_1.env.googleClientId,
    });
};
exports.googleConfig = googleConfig;
//# sourceMappingURL=auth.controller.js.map