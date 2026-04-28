import { Router } from "express";
import {
  searchUsersController,
  getUserDetailsController,
  updateProfileController,
  changePasswordController,
} from "./users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireVerifiedEmail } from "../../middleware/verified.middleware";
import { upload } from "../../utils/upload";
import { uploadPhotoController } from "./users.controller";

const router = Router();

router.get("/", authenticate, requireVerifiedEmail, searchUsersController);
router.get("/:userId", authenticate, requireVerifiedEmail, getUserDetailsController);
router.put("/profile", authenticate, requireVerifiedEmail, updateProfileController);
router.put("/change-password", authenticate, requireVerifiedEmail, changePasswordController);

router.post(
  "/upload-photo",
  authenticate,
  requireVerifiedEmail,
  upload.single("photo"),
  uploadPhotoController
);

export default router;
