"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const run = (command) => {
    console.log(`[deploy] Running: ${command}`);
    (0, node_child_process_1.execSync)(command, {
        stdio: "inherit",
        env: process.env,
    });
};
const start = async () => {
    try {
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
        const hasDatabasePublicUrl = Boolean(process.env.DATABASE_PUBLIC_URL?.trim());
        console.log(`[deploy] DATABASE_URL present: ${hasDatabaseUrl ? "yes" : "no"}, DATABASE_PUBLIC_URL present: ${hasDatabasePublicUrl ? "yes" : "no"}`);
        run("npx prisma migrate deploy --schema prisma/schema.prisma");
        console.log("[deploy] Migrations finished. Starting API server...");
        await Promise.resolve().then(() => __importStar(require("./server")));
    }
    catch (error) {
        console.error("[deploy] Startup failed:", error);
        process.exit(1);
    }
};
void start();
//# sourceMappingURL=start-deploy.js.map