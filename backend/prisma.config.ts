import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.DATABASE_PUBLIC_URL?.trim() ||
  "postgresql://postgres:postgres@localhost:5432/chatapp?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
