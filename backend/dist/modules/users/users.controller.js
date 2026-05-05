"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDeviceTokenController = exports.uploadPhotoController = exports.changePasswordController = exports.updateProfileController = exports.getUserDetailsController = exports.searchUsersController = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const users_service_1 = require("./users.service");
const validation_1 = require("../../utils/validation");
const cloudinary_1 = require("../../utils/cloudinary");
/* ===================== SEARCH USERS ===================== */
const searchUsersController = async (req, res) => {
    try {
        const query = (0, validation_1.validateSearchQuery)(req.query.query);
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const users = await (0, users_service_1.searchUsers)(query, currentUserId);
        return res.json({ users });
    }
    catch (error) {
        return res.status(400).json({
            message: error?.message || "Failed to search users",
        });
    }
};
exports.searchUsersController = searchUsersController;
const getUserDetailsController = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const userIdParam = req.params.userId;
        const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!userId) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (!(0, validation_1.isValidUuid)(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }
        const user = await (0, users_service_1.getUserDetails)(userId);
        return res.json({ user });
    }
    catch (error) {
        return res.status(404).json({
            message: error?.message || "Failed to fetch user details",
        });
    }
};
exports.getUserDetailsController = getUserDetailsController;
/* ===================== UPDATE PROFILE ===================== */
const updateProfileController = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { firstName, lastName, username, email } = req.body;
        if (!firstName || !lastName || !username || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const updatedUser = await (0, users_service_1.updateProfile)({
            userId,
            firstName,
            lastName,
            username,
            email,
        });
        return res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to update profile",
        });
    }
};
exports.updateProfileController = updateProfileController;
/* ===================== CHANGE PASSWORD ===================== */
const changePasswordController = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters",
            });
        }
        const result = await (0, users_service_1.changePassword)({
            userId,
            currentPassword,
            newPassword,
        });
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message || "Failed to change password",
        });
    }
};
exports.changePasswordController = changePasswordController;
/* ===================== UPLOAD PROFILE PHOTO ===================== */
const uploadPhotoController = async (req, res) => {
    try {
        const userId = req.user?.id; // ✅ IMPORTANT (not userId!)
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const uploadedImage = await (0, cloudinary_1.uploadImageBuffer)(req.file, "chat-app/avatars");
        const imageUrl = uploadedImage.secure_url;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                profilePhotoUrl: imageUrl,
            },
        });
        return res.json({
            message: "Profile photo updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Upload failed",
        });
    }
};
exports.uploadPhotoController = uploadPhotoController;
const upsertDeviceTokenController = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { token, platform } = req.body || {};
        if (!token || typeof token !== "string") {
            return res.status(400).json({ message: "Device token is required" });
        }
        if (!platform || typeof platform !== "string") {
            return res.status(400).json({ message: "Platform is required" });
        }
        const deviceToken = await (0, users_service_1.upsertUserDeviceToken)({
            userId,
            token,
            platform,
        });
        return res.status(200).json({
            message: "Device token stored successfully",
            deviceToken,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error?.message || "Failed to store device token",
        });
    }
};
exports.upsertDeviceTokenController = upsertDeviceTokenController;
//# sourceMappingURL=users.controller.js.map