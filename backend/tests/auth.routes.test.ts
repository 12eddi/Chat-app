import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/chat_app_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.CLIENT_URL ??= "http://localhost:5173";

vi.mock("../src/modules/auth/auth.service", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  resendVerificationEmail: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.user = {
      id: "user-123",
      email: "user@example.com",
    };
    next();
  },
}));

const { default: app } = await import("../src/app");
const authService = await import("../src/modules/auth/auth.service");

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user successfully", async () => {
    vi.mocked(authService.registerUser).mockResolvedValue({
      id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      username: "jane",
      email: "jane@example.com",
    } as any);

    const response = await request(app).post("/api/auth/register").send({
      firstName: "Jane",
      lastName: "Doe",
      username: "jane",
      email: "jane@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User created");
    expect(response.body.user.email).toBe("jane@example.com");
    expect(authService.registerUser).toHaveBeenCalledOnce();
  });

  it("logs in successfully", async () => {
    vi.mocked(authService.loginUser).mockResolvedValue({
      token: "jwt-token",
      user: {
        id: "user-1",
        email: "jane@example.com",
      },
    } as any);

    const response = await request(app).post("/api/auth/login").send({
      identifier: "jane@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBe("jwt-token");
  });

  it("returns current user on /me", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      username: "user123",
    } as any);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("user-123");
    expect(authService.getCurrentUser).toHaveBeenCalledWith("user-123");
  });

  it("validates forgot password email", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email is required");
  });

  it("handles forgot password successfully", async () => {
    vi.mocked(authService.requestPasswordReset).mockResolvedValue({
      message: "If this email exists, a reset link has been sent.",
    });

    const response = await request(app).post("/api/auth/forgot-password").send({
      email: "jane@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If this email exists, a reset link has been sent."
    );
  });

  it("validates reset password input", async () => {
    const response = await request(app).post("/api/auth/reset-password").send({
      token: "abc",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Password must be at least 6 characters long");
  });

  it("resets password successfully", async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({
      message: "Password reset successful",
    });

    const response = await request(app).post("/api/auth/reset-password").send({
      token: "valid-token",
      password: "secret123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password reset successful");
  });

  it("verifies email successfully", async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue({
      message: "Email verified successfully",
    });

    const response = await request(app).post("/api/auth/verify-email").send({
      token: "verify-token",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Email verified successfully");
  });

  it("resends verification email successfully", async () => {
    vi.mocked(authService.resendVerificationEmail).mockResolvedValue({
      message: "If this email exists, a verification email has been sent.",
    });

    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({
        email: "jane@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If this email exists, a verification email has been sent."
    );
  });
});
