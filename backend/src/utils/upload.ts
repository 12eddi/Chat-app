import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const uploadDirectory = "uploads/";

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: unknown,
    _file: unknown,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDirectory);
  },
  filename: (
    _req: unknown,
    file: { originalname: string },
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile?: boolean) => void
  ) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }

    cb(null, true);
  },
});
