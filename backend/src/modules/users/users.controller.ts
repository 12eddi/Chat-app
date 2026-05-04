import { Request, Response } from "express";
import prisma from "../../config/prisma";
import {
  searchUsers,
  getUserDetails,
  updateProfile,
  changePassword,
} from "./users.service";
import { isValidUuid, validateSearchQuery } from "../../utils/validation";
import { uploadImageBuffer, type UploadedImageFile } from "../../utils/cloudinary";

/* ===================== SEARCH USERS ===================== */
export const searchUsersController = async (req: Request, res: Response) => {
  try {
    const query = validateSearchQuery(req.query.query);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = await searchUsers(query, currentUserId);

    return res.json({ users });
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to search users",
    });
  }
};

export const getUserDetailsController = async (req: Request, res: Response) => {
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

    if (!isValidUuid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await getUserDetails(userId);

    return res.json({ user });
  } catch (error: any) {
    return res.status(404).json({
      message: error?.message || "Failed to fetch user details",
    });
  }
};

/* ===================== UPDATE PROFILE ===================== */
export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName, username, email } = req.body;

    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedUser = await updateProfile({
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
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update profile",
    });
  }
};

/* ===================== CHANGE PASSWORD ===================== */
export const changePasswordController = async (req: Request, res: Response) => {
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

    const result = await changePassword({
      userId,
      currentPassword,
      newPassword,
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to change password",
    });
  }
};

/* ===================== UPLOAD PROFILE PHOTO ===================== */
export const uploadPhotoController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // ✅ IMPORTANT (not userId!)

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadedImage = await uploadImageBuffer(
      req.file as unknown as UploadedImageFile,
      "chat-app/avatars"
    );
    const imageUrl = uploadedImage.secure_url;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhotoUrl: imageUrl,
      },
    });

    return res.json({
      message: "Profile photo updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Upload failed",
    });
  }
};
