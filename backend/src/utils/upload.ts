import multer from "multer";
import { Request } from "express";

export const upload = multer({
  storage: multer.memoryStorage(),
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
