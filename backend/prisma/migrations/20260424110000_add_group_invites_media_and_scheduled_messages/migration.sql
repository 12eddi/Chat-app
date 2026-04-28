DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ChatParticipantRole'
  ) THEN
    CREATE TYPE "ChatParticipantRole" AS ENUM ('MEMBER', 'ADMIN', 'OWNER');
  END IF;
END
$$;

DO $$
BEGIN
  ALTER TYPE "ChatParticipantRole" ADD VALUE IF NOT EXISTS 'ADMIN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'GroupInviteStatus'
  ) THEN
    CREATE TYPE "GroupInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
  END IF;
END
$$;

ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "GroupInvite" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "status" "GroupInviteStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupInvite_chatId_fkey'
  ) THEN
    ALTER TABLE "GroupInvite"
    ADD CONSTRAINT "GroupInvite_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupInvite_userId_fkey'
  ) THEN
    ALTER TABLE "GroupInvite"
    ADD CONSTRAINT "GroupInvite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupInvite_invitedById_fkey'
  ) THEN
    ALTER TABLE "GroupInvite"
    ADD CONSTRAINT "GroupInvite_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "GroupInvite_chatId_userId_key"
ON "GroupInvite"("chatId", "userId");

CREATE INDEX IF NOT EXISTS "GroupInvite_userId_status_idx"
ON "GroupInvite"("userId", "status");

CREATE INDEX IF NOT EXISTS "Message_chatId_scheduledFor_sentAt_idx"
ON "Message"("chatId", "scheduledFor", "sentAt");
