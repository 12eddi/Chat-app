import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/chat_app_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.CLIENT_URL ??= "http://localhost:5173";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../src/modules/chats/chats.service", () => ({
  acceptGroupInvite: vi.fn(),
  createGroupChat: vi.fn(),
  getOrCreateDirectChat: vi.fn(),
  getPendingGroupInvites: vi.fn(),
  getUserChats: vi.fn(),
  inviteGroupParticipants: vi.fn(),
  leaveGroup: vi.fn(),
  rejectGroupInvite: vi.fn(),
  removeGroupMember: vi.fn(),
  updateGroupDetails: vi.fn(),
  updateParticipantRole: vi.fn(),
}));

vi.mock("../src/socket", () => ({
  getSocketServer: () => ({
    to: toMock,
  }),
}));

vi.mock("../src/modules/notifications/notifications.service", () => ({
  createNotification: vi.fn().mockResolvedValue({
    id: "notification-1",
    type: "GROUP_INVITE",
    title: "Group invitation",
    body: "You have been invited",
    isRead: false,
  }),
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.user = {
      id: "123e4567-e89b-12d3-a456-426614174000",
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

const baseChat = {
  id: "123e4567-e89b-12d3-a456-426614174101",
  name: "Team Room",
  type: "group",
  participants: [
    {
      id: "123e4567-e89b-12d3-a456-426614174201",
      userId: "123e4567-e89b-12d3-a456-426614174000",
      role: "OWNER",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "Alex",
        lastName: "Hr",
      },
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174202",
      userId: "123e4567-e89b-12d3-a456-426614174001",
      role: "MEMBER",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174001",
        firstName: "Irina",
        lastName: "Test",
      },
    },
  ],
  invites: [
    {
      id: "123e4567-e89b-12d3-a456-426614174301",
      userId: "123e4567-e89b-12d3-a456-426614174001",
    },
  ],
};

const { default: app } = await import("../src/app");
const chatsService = await import("../src/modules/chats/chats.service");

describe("chat routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emitMock.mockClear();
    toMock.mockClear();
  });

  it("creates a group chat and notifies invitees", async () => {
    vi.mocked(chatsService.createGroupChat).mockResolvedValue(baseChat as any);

    const response = await request(app)
      .post("/api/chats/group")
      .set("Authorization", "Bearer test-token")
      .send({
        name: "Team Room",
        userIds: ["123e4567-e89b-12d3-a456-426614174001"],
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Group chat created successfully");
    expect(chatsService.createGroupChat).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
      "Team Room",
      ["123e4567-e89b-12d3-a456-426614174001"]
    );
    expect(toMock).toHaveBeenCalledWith("user:123e4567-e89b-12d3-a456-426614174001");
    expect(emitMock).toHaveBeenCalledWith("group_invites:updated");
  });

  it("fetches pending invites", async () => {
    vi.mocked(chatsService.getPendingGroupInvites).mockResolvedValue([
      { id: "123e4567-e89b-12d3-a456-426614174301" },
    ] as any);

    const response = await request(app)
      .get("/api/chats/invites")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.invites).toHaveLength(1);
    expect(chatsService.getPendingGroupInvites).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000"
    );
  });

  it("accepts an invite and emits updates", async () => {
    vi.mocked(chatsService.acceptGroupInvite).mockResolvedValue(baseChat as any);

    const response = await request(app)
      .post("/api/chats/invites/123e4567-e89b-12d3-a456-426614174301/accept")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Invite accepted");
    expect(chatsService.acceptGroupInvite).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174301",
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(emitMock).toHaveBeenCalledWith("group_invites:updated");
  });

  it("rejects an invite and emits updates", async () => {
    vi.mocked(chatsService.rejectGroupInvite).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/chats/invites/123e4567-e89b-12d3-a456-426614174301/reject")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Invite rejected");
    expect(chatsService.rejectGroupInvite).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174301",
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(emitMock).toHaveBeenCalledWith("group_invites:updated");
  });

  it("updates a participant role", async () => {
    vi.mocked(chatsService.updateParticipantRole).mockResolvedValue(baseChat as any);

    const response = await request(app)
      .patch(
        "/api/chats/123e4567-e89b-12d3-a456-426614174101/participants/123e4567-e89b-12d3-a456-426614174202/role"
      )
      .set("Authorization", "Bearer test-token")
      .send({ role: "ADMIN" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Participant role updated");
    expect(chatsService.updateParticipantRole).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174101",
      "123e4567-e89b-12d3-a456-426614174000",
      "123e4567-e89b-12d3-a456-426614174202",
      "ADMIN"
    );
  });

  it("updates group details", async () => {
    vi.mocked(chatsService.updateGroupDetails).mockResolvedValue({
      ...baseChat,
      name: "New Team Room",
      photoUrl: "/uploads/team-room.png",
    } as any);

    const response = await request(app)
      .patch("/api/chats/123e4567-e89b-12d3-a456-426614174101")
      .set("Authorization", "Bearer test-token")
      .field("name", "New Team Room");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Group updated successfully");
    expect(chatsService.updateGroupDetails).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174101",
      "123e4567-e89b-12d3-a456-426614174000",
      {
        name: "New Team Room",
        photoUrl: undefined,
      }
    );
  });

  it("removes a participant", async () => {
    vi.mocked(chatsService.removeGroupMember).mockResolvedValue(baseChat as any);

    const response = await request(app)
      .delete(
        "/api/chats/123e4567-e89b-12d3-a456-426614174101/participants/123e4567-e89b-12d3-a456-426614174202"
      )
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Participant removed");
    expect(chatsService.removeGroupMember).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174101",
      "123e4567-e89b-12d3-a456-426614174000",
      "123e4567-e89b-12d3-a456-426614174202"
    );
  });

  it("lets a member leave a group", async () => {
    vi.mocked(chatsService.leaveGroup).mockResolvedValue(baseChat as any);

    const response = await request(app)
      .post("/api/chats/123e4567-e89b-12d3-a456-426614174101/leave")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Left group successfully");
    expect(chatsService.leaveGroup).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174101",
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(emitMock).toHaveBeenCalledWith("chat:left", {
      chatId: "123e4567-e89b-12d3-a456-426614174101",
    });
  });

  it("rejects invalid invite ids", async () => {
    const response = await request(app)
      .post("/api/chats/invites/not-a-uuid/accept")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid invite id");
  });
});
