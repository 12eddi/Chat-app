"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = void 0;
const env_1 = require("../config/env");
const verifyGoogleIdToken = async (idToken) => {
    if (!env_1.env.googleClientId) {
        throw new Error("Google sign-in is not configured");
    }
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
        throw new Error("Google token is invalid");
    }
    const tokenInfo = (await response.json());
    if (tokenInfo.aud !== env_1.env.googleClientId) {
        throw new Error("Google token audience is invalid");
    }
    if (!tokenInfo.email || tokenInfo.email_verified !== "true" || !tokenInfo.sub) {
        throw new Error("Google account email is not verified");
    }
    return tokenInfo;
};
exports.verifyGoogleIdToken = verifyGoogleIdToken;
//# sourceMappingURL=google.js.map