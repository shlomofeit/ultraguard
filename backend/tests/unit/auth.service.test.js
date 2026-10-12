import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken } from "../../utils/generateToken.js";
import { authService } from "../../services/auth.service.js";
import { usersRepo } from "../../repositories/users.repo.js";
import { adminMiddleware } from "../../middlewares/adminMiddleware.js";

vi.mock("../../repositories/users.repo.js", () => ({
  usersRepo: {
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
  },
}));

process.env.SECRET_KEY = "test-secret";

const userRow = {
  id: "user-1",
  name: "Avi",
  email: "avi@example.com",
  role: "viewer",
  password_hash: "",
  created_at: "2026-10-11T08:00:00.000Z",
};

describe("authService", () => {
  beforeEach(() => {
    vi.mocked(usersRepo.getUserByEmail).mockReset();
    vi.mocked(usersRepo.getUserById).mockReset();
    vi.mocked(usersRepo.createUser).mockReset();
  });

  it("rejects a taken email with status 409", async () => {
    vi.mocked(usersRepo.getUserByEmail).mockResolvedValue(userRow);

    await expect(
      authService.register({
        name: "Avi",
        email: "avi@example.com",
        password: "12345678",
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(usersRepo.createUser).not.toHaveBeenCalled();
  });

  it("saves a hash and never returns it", async () => {
    vi.mocked(usersRepo.getUserByEmail).mockResolvedValue(null);
    vi.mocked(usersRepo.createUser).mockImplementation(async (row) => ({
      ...userRow,
      password_hash: row.password_hash,
    }));

    const { user, tokens } = await authService.register({
      name: "Avi",
      email: "AVI@example.com",
      password: "12345678",
    });

    const row = vi.mocked(usersRepo.createUser).mock.calls[0][0];
    expect(row.email).toBe("avi@example.com");
    expect(row.password_hash).not.toBe("12345678");
    expect(await bcrypt.compare("12345678", row.password_hash)).toBe(true);
    expect(user).not.toHaveProperty("password_hash");
    expect(tokens.token).toBeTruthy();
  });

  it("rejects a wrong password with status 401", async () => {
    const passwordHash = await bcrypt.hash("right-password", 4);
    vi.mocked(usersRepo.getUserByEmail).mockResolvedValue({
      ...userRow,
      password_hash: passwordHash,
    });

    await expect(
      authService.login({ email: "avi@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rejects an expired token with status 401", async () => {
    const expiredToken = jwt.sign(
      { userId: "user-1", exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.SECRET_KEY,
    );

    await expect(
      authService.getUserFromToken(expiredToken),
    ).rejects.toMatchObject({ status: 401 });
    expect(usersRepo.getUserById).not.toHaveBeenCalled();
  });

  it("rejects a missing token with status 401", async () => {
    await expect(authService.getUserFromToken(undefined)).rejects.toMatchObject(
      { status: 401 },
    );
  });

  it("accepts a token it created itself", async () => {
    vi.mocked(usersRepo.getUserById).mockResolvedValue(userRow);
    const token = generateToken("user-1", "15m");
    const user = await authService.getUserFromToken(token);
    expect(user.id).toBe("user-1");
  });
});

describe("adminMiddleware", () => {
  it("blocks a viewer with status 403", () => {
    const req = { user: { role: "viewer" } };

    expect(() => adminMiddleware(req, {}, vi.fn())).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
});
