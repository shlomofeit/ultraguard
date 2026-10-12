import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersService } from "../../services/users.service.js";
import { usersRepo } from "../../repositories/users.repo.js";
import { roomMembersRepo } from "../../repositories/roomMembers.repo.js";

vi.mock("../../repositories/users.repo.js", () => ({
  usersRepo: { getUsers: vi.fn(), getUserById: vi.fn(), updateUser: vi.fn() },
}));

vi.mock("../../repositories/roomMembers.repo.js", () => ({
  roomMembersRepo: {
    getMembers: vi.fn(),
    getRoomIdsByUser: vi.fn(),
    replaceUserRooms: vi.fn(),
  },
}));

const ROOM_A = "1a1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const ROOM_B = "2b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const admin = { id: "admin-1", role: "admin" };

const userRow = {
  id: "viewer-1",
  name: "Dana",
  email: "dana@example.com",
  role: "viewer",
  password_hash: "secret",
  created_at: "2026-10-11T08:00:00.000Z",
};

describe("usersService", () => {
  beforeEach(() => {
    vi.mocked(usersRepo.getUserById).mockReset();
    vi.mocked(usersRepo.updateUser).mockReset();
    vi.mocked(roomMembersRepo.replaceUserRooms).mockReset();
  });

  it("lists users with their rooms and without the password", async () => {
    vi.mocked(usersRepo.getUsers).mockResolvedValue([userRow]);
    vi.mocked(roomMembersRepo.getMembers).mockResolvedValue([
      { user_id: "viewer-1", room_id: ROOM_A },
      { user_id: "someone-else", room_id: ROOM_B },
    ]);

    const [user] = await usersService.getUsers();

    expect(user.roomIds).toEqual([ROOM_A]);
    expect(user).not.toHaveProperty("password_hash");
  });

  it("replaces the rooms of a user without repeats", async () => {
    vi.mocked(usersRepo.getUserById).mockResolvedValue(userRow);

    const user = await usersService.setUserRooms("viewer-1", {
      roomIds: [ROOM_A, ROOM_B, ROOM_A],
    });

    expect(roomMembersRepo.replaceUserRooms).toHaveBeenCalledWith("viewer-1", [
      ROOM_A,
      ROOM_B,
    ]);
    expect(user.roomIds).toEqual([ROOM_A, ROOM_B]);
  });

  it("rejects rooms that are not ids with status 400", async () => {
    await expect(
      usersService.setUserRooms("viewer-1", { roomIds: ["lab"] }),
    ).rejects.toMatchObject({ status: 400 });
    expect(roomMembersRepo.replaceUserRooms).not.toHaveBeenCalled();
  });

  it("rejects rooms for a missing user with status 404", async () => {
    vi.mocked(usersRepo.getUserById).mockResolvedValue(null);

    await expect(
      usersService.setUserRooms("nope", { roomIds: [] }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("changes the role of another user", async () => {
    vi.mocked(usersRepo.updateUser).mockResolvedValue({
      ...userRow,
      role: "admin",
    });
    vi.mocked(roomMembersRepo.getRoomIdsByUser).mockResolvedValue([]);

    const user = await usersService.setUserRole(admin, "viewer-1", {
      role: "admin",
    });

    expect(usersRepo.updateUser).toHaveBeenCalledWith("viewer-1", {
      role: "admin",
    });
    expect(user.role).toBe("admin");
  });

  it("does not let an admin remove their own admin role", async () => {
    await expect(
      usersService.setUserRole(admin, "admin-1", { role: "viewer" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(usersRepo.updateUser).not.toHaveBeenCalled();
  });

  it("rejects an unknown role with status 400", async () => {
    await expect(
      usersService.setUserRole(admin, "viewer-1", { role: "owner" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
