"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getUserDetails = exports.searchUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const searchUsers = async (query, currentUserId) => {
    return prisma_1.default.user.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        { username: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ],
                },
                {
                    NOT: {
                        id: currentUserId,
                    },
                },
            ],
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profilePhotoUrl: true,
        },
        take: 20,
    });
};
exports.searchUsers = searchUsers;
const getUserDetails = async (userId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            username: true,
            email: true,
            profilePhotoUrl: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getUserDetails = getUserDetails;
const updateProfile = async ({ userId, firstName, lastName, username, email, }) => {
    const existingUser = await prisma_1.default.user.findFirst({
        where: {
            AND: [
                {
                    OR: [{ username }, { email }],
                },
                {
                    NOT: { id: userId },
                },
            ],
        },
    });
    if (existingUser) {
        if (existingUser.username === username) {
            throw new Error("Username is already taken");
        }
        if (existingUser.email === email) {
            throw new Error("Email is already taken");
        }
    }
    const updatedUser = await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            firstName,
            lastName,
            username,
            email,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            birthDate: true,
            profilePhotoUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return updatedUser;
};
exports.updateProfile = updateProfile;
const changePassword = async ({ userId, currentPassword, newPassword, }) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.passwordHash) {
        throw new Error("Password change is unavailable for Google-only accounts");
    }
    const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            passwordHash: hashedPassword,
        },
    });
    return { message: "Password changed successfully" };
};
exports.changePassword = changePassword;
//# sourceMappingURL=users.service.js.map