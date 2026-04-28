"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedEmail = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const requireVerifiedEmail = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                emailVerified: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email before accessing this feature",
            });
        }
        next();
    }
    catch {
        return res.status(500).json({
            message: "Failed to verify account status",
        });
    }
};
exports.requireVerifiedEmail = requireVerifiedEmail;
//# sourceMappingURL=verified.middleware.js.map