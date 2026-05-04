import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { env } from "../config/env";

export type UploadedImageFile = {
  buffer: Buffer;
};

if (env.cloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

type UploadFolder = "chat-app/messages" | "chat-app/avatars";

const ensureCloudinaryConfigured = () => {
  if (!env.cloudinary) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
};

export const uploadImageBuffer = async (
  file: UploadedImageFile,
  folder: UploadFolder
) => {
  ensureCloudinaryConfigured();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};
