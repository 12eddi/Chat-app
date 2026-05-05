"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUserDevices = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const firebase_admin_1 = require("./firebase-admin");
const sendPushToUserDevices = async (payload) => {
    if (!(0, firebase_admin_1.isFirebaseConfigured)()) {
        return;
    }
    const app = (0, firebase_admin_1.getFirebaseAdminApp)();
    if (!app) {
        return;
    }
    const messaging = app.messaging();
    const deviceTokens = await prisma_1.default.userDeviceToken.findMany({
        where: {
            userId: payload.userId,
        },
        select: {
            id: true,
            token: true,
        },
    });
    if (deviceTokens.length === 0) {
        return;
    }
    const response = await messaging.sendEachForMulticast({
        tokens: deviceTokens.map((item) => item.token),
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data,
    });
    const invalidTokenIds = response.responses
        .map((result, index) => ({ result, token: deviceTokens[index] ?? null }))
        .filter(({ result }) => {
        if (result.success || !result.error) {
            return false;
        }
        const code = result.error.code;
        return (code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered");
    })
        .filter((entry) => entry.token !== null)
        .map(({ token }) => token.id);
    if (invalidTokenIds.length > 0) {
        await prisma_1.default.userDeviceToken.deleteMany({
            where: {
                id: {
                    in: invalidTokenIds,
                },
            },
        });
    }
};
exports.sendPushToUserDevices = sendPushToUserDevices;
//# sourceMappingURL=push.js.map