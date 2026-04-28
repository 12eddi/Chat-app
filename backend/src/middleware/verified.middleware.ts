import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export const requireVerifiedEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
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
  } catch {
    return res.status(500).json({
      message: "Failed to verify account status",
    });
  }
};
