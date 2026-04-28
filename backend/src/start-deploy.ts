import { execSync } from "node:child_process";

const run = (command: string) => {
  console.log(`[deploy] Running: ${command}`);
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
};

const start = async () => {
  try {
    run("npx prisma migrate deploy --schema prisma/schema.prisma");
    console.log("[deploy] Migrations finished. Starting API server...");
    await import("./server");
  } catch (error) {
    console.error("[deploy] Startup failed:", error);
    process.exit(1);
  }
};

void start();

