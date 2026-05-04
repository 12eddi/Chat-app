import type { UploadApiResponse } from "cloudinary";
export type UploadedImageFile = {
    buffer: Buffer;
};
type UploadFolder = "chat-app/messages" | "chat-app/avatars";
export declare const uploadImageBuffer: (file: UploadedImageFile, folder: UploadFolder) => Promise<UploadApiResponse>;
export {};
//# sourceMappingURL=cloudinary.d.ts.map