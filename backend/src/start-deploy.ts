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
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const hasDatabasePublicUrl = Boolean(process.env.DATABASE_PUBLIC_URL?.trim());

    console.log(
      `[deploy] DATABASE_URL present: ${hasDatabaseUrl ? "yes" : "no"}, DATABASE_PUBLIC_URL present: ${hasDatabasePublicUrl ? "yes" : "no"}`
    );

    run("npx prisma migrate deploy --schema prisma/schema.prisma");
    console.log("[deploy] Migrations finished. Starting API server...");
    await import("./server");
  } catch (error) {
    console.error("[deploy] Startup failed:", error);
    process.exit(1);
  }
};

void start();
