import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/chat_app_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.CLIENT_URL ??= "http://localhost:5173";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../src/modules/messages/messages.service", () => ({
  getDueScheduledMessages: vi.fn(),
  markScheduledMessageAsSent: vi.fn(),
}));

vi.mock("../src/modules/notifications/notifications.service", () => ({
  createNotification: vi.fn().mockResolvedValue({
    id: "notification-1",
    type: "MESSAGE",
    title: "New message",
    body: "Scheduled hello",
  }),
}));

vi.mock("../src/socket", () => ({
  getSocketServer: () => ({
    to: toMock,
  }),
}));

const schedulerModule = await import("../src/modules/messages/message-scheduler");
const messagesService = await import("../src/modules/messages/messages.service");

describe("scheduled message processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emitMock.mockClear();
    toMock.mockClear();
  });

  it("processes due scheduled messages and notifies recipients", async () => {
    vi.mocked(messagesService.getDueScheduledMessages)
      .mockResolvedValueOnce([
        {
          id: "message-1",
          senderId: "user-1",
          chat: {
            participants: [{ userId: "user-1" }, { userId: "user-2" }],
          },
        },
      ] as any)
      .mockResolvedValueOnce([]);

    vi.mocked(messagesService.markScheduledMessageAsSent).mockResolvedValue({
      id: "message-1",
      chatId: "chat-1",
      content: "Scheduled hello",
      sender: { firstName: "Alex" },
      imageUrl: null,
    } as any);

    const processedCount = await schedulerModule.processScheduledMessages();

    expect(processedCount).toBe(1);
    expect(messagesService.getDueScheduledMessages).toHaveBeenCalled();
    expect(messagesService.markScheduledMessageAsSent).toHaveBeenCalledWith("message-1");
    expect(toMock).toHaveBeenCalledWith("user:user-2");
    expect(emitMock).toHaveBeenCalledWith(
      "receive_message",
      expect.objectContaining({ id: "message-1" })
    );
  });

  it("skips messages that were already claimed elsewhere", async () => {
    vi.mocked(messagesService.getDueScheduledMessages)
      .mockResolvedValueOnce([
        {
          id: "message-1",
          senderId: "user-1",
          chat: {
            participants: [{ userId: "user-1" }, { userId: "user-2" }],
          },
        },
      ] as any)
      .mockResolvedValueOnce([]);

    vi.mocked(messagesService.markScheduledMessageAsSent).mockResolvedValue(null);

    const processedCount = await schedulerModule.processScheduledMessages();

    expect(processedCount).toBe(0);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
