import request from "supertest";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/chat_app_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.CLIENT_URL ??= "http://localhost:5173";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../src/modules/messages/messages.service", () => ({
  sendMessage: vi.fn(),
  getMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
  editMessage: vi.fn(),
  deleteMessage: vi.fn(),
  rescheduleMessage: vi.fn(),
  cancelScheduledMessage: vi.fn(),
  toggleMessageReaction: vi.fn(),
}));

vi.mock("../src/socket", () => ({
  getSocketServer: () => ({
    to: toMock,
  }),
}));

vi.mock("../src/modules/notifications/notifications.service", () => ({
  createNotification: vi.fn().mockResolvedValue({
    id: "notification-1",
    type: "MESSAGE",
    title: "New message",
    body: "Hello there",
    isRead: false,
    createdAt: new Date().toISOString(),
  }),
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.user = {
      id: "user-123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
    };
    next();
  },
}));

vi.mock("../src/middleware/verified.middleware", () => ({
  requireVerifiedEmail: (_req: any, _res: any, next: () => void) => {
    next();
  },
}));

const { default: app } = await import("../src/app");
const messagesService = await import("../src/modules/messages/messages.service");

describe("message routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emitMock.mockClear();
    toMock.mockClear();
  });

  it("creates a message and emits to recipients", async () => {
    vi.mocked(messagesService.sendMessage).mockResolvedValue({
      message: {
        id: "message-1",
        chatId: "123e4567-e89b-12d3-a456-426614174001",
        content: "Hello there",
        sender: { id: "user-123e4567-e89b-12d3-a456-426614174000" },
      } as any,
      recipientIds: ["user-456e4567-e89b-12d3-a456-426614174000"],
      isScheduled: false,
    });

    const response = await request(app)
      .post("/api/chats/123e4567-e89b-12d3-a456-426614174001/messages")
      .set("Authorization", "Bearer test-token")
      .send({ content: "Hello there" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Message sent successfully");
    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174001",
      "user-123e4567-e89b-12d3-a456-426614174000",
      "Hello there",
      {
        imageUrl: null,
        scheduledFor: null,
      }
    );
    expect(toMock).toHaveBeenCalledWith("user:user-456e4567-e89b-12d3-a456-426614174000");
    expect(emitMock).toHaveBeenCalledWith(
      "receive_message",
      expect.objectContaining({ id: "message-1" })
    );
  });

  it("rejects invalid chat ids when creating messages", async () => {
    const response = await request(app)
      .post("/api/chats/not-a-uuid/messages")
      .set("Authorization", "Bearer test-token")
      .send({ content: "Hello there" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid chat id");
  });

  it("creates a scheduled image message", async () => {
    vi.mocked(messagesService.sendMessage).mockResolvedValue({
      message: {
        id: "message-2",
        chatId: "123e4567-e89b-12d3-a456-426614174001",
        content: "",
        imageUrl: "/uploads/test-image.png",
        sender: { id: "user-123e4567-e89b-12d3-a456-426614174000", firstName: "Alex" },
      } as any,
      recipientIds: [],
      isScheduled: true,
    });

    const response = await request(app)
      .post("/api/chats/123e4567-e89b-12d3-a456-426614174001/messages")
      .set("Authorization", "Bearer test-token")
      .field("content", "")
      .field("scheduledFor", "2026-04-28T12:00:00.000Z")
      .attach("image", Buffer.from("fake-image"), {
        filename: "image.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Message scheduled successfully");
    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174001",
      "user-123e4567-e89b-12d3-a456-426614174000",
      "",
      expect.objectContaining({
        imageUrl: expect.stringMatching(/^\/uploads\/.+\.png$/),
        scheduledFor: new Date("2026-04-28T12:00:00.000Z"),
      })
    );

    const imageUrl = vi.mocked(messagesService.sendMessage).mock.calls.at(-1)?.[3]?.imageUrl;

    if (imageUrl) {
      const uploadedFilePath = path.join(process.cwd(), imageUrl.replace(/^\//, ""));

      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }
  });

  it("fetches messages and emits read receipts", async () => {
    vi.mocked(messagesService.markMessagesAsRead).mockResolvedValue({
      messageIds: ["message-1"],
      senderIds: ["user-999e4567-e89b-12d3-a456-426614174000"],
    });
    vi.mocked(messagesService.getMessages).mockResolvedValue([
      {
        id: "message-1",
        content: "Hello",
      },
    ] as any);

    const response = await request(app)
      .get("/api/chats/123e4567-e89b-12d3-a456-426614174001/messages")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.messages).toHaveLength(1);
    expect(emitMock).toHaveBeenCalledWith("messages_read", {
      chatId: "123e4567-e89b-12d3-a456-426614174001",
      readerId: "user-123e4567-e89b-12d3-a456-426614174000",
      messageIds: ["message-1"],
    });
  });

  it("updates a message and emits the change", async () => {
    vi.mocked(messagesService.editMessage).mockResolvedValue({
      message: {
        id: "message-1",
        content: "Updated text",
      } as any,
      participantIds: [
        "user-123e4567-e89b-12d3-a456-426614174000",
        "user-456e4567-e89b-12d3-a456-426614174000",
      ],
    });

    const response = await request(app)
      .patch("/api/chats/messages/123e4567-e89b-12d3-a456-426614174099")
      .set("Authorization", "Bearer test-token")
      .send({ content: "Updated text" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Message updated successfully");
    expect(emitMock).toHaveBeenCalledWith(
      "message_updated",
      expect.objectContaining({ id: "message-1" })
    );
  });

  it("updates a scheduled message and emits the change", async () => {
    vi.mocked(messagesService.rescheduleMessage).mockResolvedValue({
      message: {
        id: "message-3",
        content: "Later today",
      } as any,
      participantIds: ["user-123e4567-e89b-12d3-a456-426614174000"],
    });

    const response = await request(app)
      .patch("/api/chats/messages/123e4567-e89b-12d3-a456-426614174099/schedule")
      .set("Authorization", "Bearer test-token")
      .send({
        content: "Later today",
        scheduledFor: "2026-04-28T13:30:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Scheduled message updated successfully");
    expect(messagesService.rescheduleMessage).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174099",
      "user-123e4567-e89b-12d3-a456-426614174000",
      "Later today",
      new Date("2026-04-28T13:30:00.000Z")
    );
    expect(emitMock).toHaveBeenCalledWith(
      "message_updated",
      expect.objectContaining({ id: "message-3" })
    );
  });

  it("cancels a scheduled message and emits the deletion", async () => {
    vi.mocked(messagesService.cancelScheduledMessage).mockResolvedValue({
      message: {
        id: "message-4",
        deletedAt: new Date().toISOString(),
      } as any,
      participantIds: ["user-123e4567-e89b-12d3-a456-426614174000"],
    });

    const response = await request(app)
      .post("/api/chats/messages/123e4567-e89b-12d3-a456-426614174099/cancel-schedule")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Scheduled message canceled successfully");
    expect(messagesService.cancelScheduledMessage).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174099",
      "user-123e4567-e89b-12d3-a456-426614174000"
    );
    expect(emitMock).toHaveBeenCalledWith(
      "message_deleted",
      expect.objectContaining({ id: "message-4" })
    );
  });

  it("toggles a message reaction and emits the update", async () => {
    vi.mocked(messagesService.toggleMessageReaction).mockResolvedValue({
      message: {
        id: "message-5",
        reactions: [
          {
            id: "reaction-1",
            emoji: "❤️",
            userId: "user-123e4567-e89b-12d3-a456-426614174000",
          },
        ],
      } as any,
      participantIds: [
        "user-123e4567-e89b-12d3-a456-426614174000",
        "user-456e4567-e89b-12d3-a456-426614174000",
      ],
    });

    const response = await request(app)
      .post("/api/chats/messages/123e4567-e89b-12d3-a456-426614174099/reactions")
      .set("Authorization", "Bearer test-token")
      .send({ emoji: "❤️" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Reaction updated successfully");
    expect(messagesService.toggleMessageReaction).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174099",
      "user-123e4567-e89b-12d3-a456-426614174000",
      "❤️"
    );
    expect(emitMock).toHaveBeenCalledWith(
      "message_updated",
      expect.objectContaining({ id: "message-5" })
    );
  });

  it("deletes a message and emits the deletion", async () => {
    vi.mocked(messagesService.deleteMessage).mockResolvedValue({
      message: {
        id: "message-1",
        deletedAt: new Date().toISOString(),
      } as any,
      participantIds: [
        "user-123e4567-e89b-12d3-a456-426614174000",
        "user-456e4567-e89b-12d3-a456-426614174000",
      ],
    });

    const response = await request(app)
      .delete("/api/chats/messages/123e4567-e89b-12d3-a456-426614174099")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Message deleted successfully");
    expect(emitMock).toHaveBeenCalledWith(
      "message_deleted",
      expect.objectContaining({ id: "message-1" })
    );
  });
});
