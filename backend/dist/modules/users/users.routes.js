"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const verified_middleware_1 = require("../../middleware/verified.middleware");
const upload_1 = require("../../utils/upload");
const users_controller_2 = require("./users.controller");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, users_controller_1.searchUsersController);
router.get("/:userId", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, users_controller_1.getUserDetailsController);
router.put("/profile", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, users_controller_1.updateProfileController);
router.put("/change-password", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, users_controller_1.changePasswordController);
router.post("/device-token", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, users_controller_1.upsertDeviceTokenController);
router.post("/upload-photo", auth_middleware_1.authenticate, verified_middleware_1.requireVerifiedEmail, upload_1.upload.single("photo"), users_controller_2.uploadPhotoController);
exports.default = router;
//# sourceMappingURL=users.routes.js.map