"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseAdminApp = exports.isFirebaseConfigured = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("../config/env");
let initializedApp = null;
const getCredential = () => {
    if (!env_1.env.firebase) {
        return null;
    }
    if ("serviceAccountJson" in env_1.env.firebase) {
        const parsed = JSON.parse(env_1.env.firebase.serviceAccountJson);
        return firebase_admin_1.default.credential.cert({
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key,
        });
    }
    return firebase_admin_1.default.credential.cert({
        projectId: env_1.env.firebase.projectId,
        clientEmail: env_1.env.firebase.clientEmail,
        privateKey: env_1.env.firebase.privateKey,
    });
};
const isFirebaseConfigured = () => Boolean(env_1.env.firebase);
exports.isFirebaseConfigured = isFirebaseConfigured;
const getFirebaseAdminApp = () => {
    if (!(0, exports.isFirebaseConfigured)()) {
        return null;
    }
    if (initializedApp) {
        return initializedApp;
    }
    if (firebase_admin_1.default.apps.length > 0) {
        initializedApp = firebase_admin_1.default.apps[0];
        return initializedApp;
    }
    const credential = getCredential();
    if (!credential) {
        return null;
    }
    initializedApp = firebase_admin_1.default.initializeApp({ credential });
    return initializedApp;
};
exports.getFirebaseAdminApp = getFirebaseAdminApp;
//# sourceMappingURL=firebase-admin.js.map