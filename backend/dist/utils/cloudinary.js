"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageBuffer = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
if (env_1.env.cloudinary) {
    cloudinary_1.v2.config({
        cloud_name: env_1.env.cloudinary.cloudName,
        api_key: env_1.env.cloudinary.apiKey,
        api_secret: env_1.env.cloudinary.apiSecret,
        secure: true,
    });
}
const ensureCloudinaryConfigured = () => {
    if (!env_1.env.cloudinary) {
        throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    }
};
const uploadImageBuffer = async (file, folder) => {
    ensureCloudinaryConfigured();
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (!result) {
                reject(new Error("Cloudinary upload failed"));
                return;
            }
            resolve(result);
        });
        stream.end(file.buffer);
    });
};
exports.uploadImageBuffer = uploadImageBuffer;
//# sourceMappingURL=cloudinary.js.map