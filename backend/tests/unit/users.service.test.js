import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersService } from "../../services/users.service.js";
import { usersRepo } from "../../repositories/users.repo.js";
import { roomMembersRepo } from "../../repositories/roomMembers.repo.js";

vi.mock("../../repositories/users.repo.js", () => ({
  usersRepo: {
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
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
    vi.mocked(usersRepo.deleteUser).mockReset();
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

  it("updates the name, role and rooms of a user without repeats", async () => {
    vi.mocked(usersRepo.updateUser).mockResolvedValue({
      ...userRow,
      name: "Dana Cohen",
    });

    const user = await usersService.updateUser(admin, "viewer-1", {
      name: " Dana Cohen ",
      role: "viewer",
      roomIds: [ROOM_A, ROOM_B, ROOM_A],
    });

    expect(usersRepo.updateUser).toHaveBeenCalledWith("viewer-1", {
      name: "Dana Cohen",
      role: "viewer",
    });
    expect(roomMembersRepo.replaceUserRooms).toHaveBeenCalledWith("viewer-1", [
      ROOM_A,
      ROOM_B,
    ]);
    expect(user.roomIds).toEqual([ROOM_A, ROOM_B]);
  });

  it("rejects rooms that are not ids or an unknown role with status 400", async () => {
    const valid = { name: "Dana", role: "viewer", roomIds: [] };

    await expect(
      usersService.updateUser(admin, "viewer-1", {
        ...valid,
        roomIds: ["lab"],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      usersService.updateUser(admin, "viewer-1", { ...valid, role: "owner" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(usersRepo.updateUser).not.toHaveBeenCalled();
  });

  it("rejects updating a missing user with status 404", async () => {
    vi.mocked(usersRepo.updateUser).mockResolvedValue(null);

    await expect(
      usersService.updateUser(admin, "nope", {
        name: "Dana",
        role: "viewer",
        roomIds: [],
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(roomMembersRepo.replaceUserRooms).not.toHaveBeenCalled();
  });

  it("does not let an admin remove their own admin role", async () => {
    await expect(
      usersService.updateUser(admin, "admin-1", {
        name: "Shlomo",
        role: "viewer",
        roomIds: [],
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(usersRepo.updateUser).not.toHaveBeenCalled();
  });

  it("deletes another user without the password in the answer", async () => {
    vi.mocked(usersRepo.deleteUser).mockResolvedValue(userRow);

    const user = await usersService.deleteUser(admin, "viewer-1");

    expect(usersRepo.deleteUser).toHaveBeenCalledWith("viewer-1");
    expect(user).not.toHaveProperty("password_hash");
  });

  it("does not let an admin delete themselves", async () => {
    await expect(
      usersService.deleteUser(admin, "admin-1"),
    ).rejects.toMatchObject({ status: 400 });
    expect(usersRepo.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects deleting a missing user with status 404", async () => {
    vi.mocked(usersRepo.deleteUser).mockResolvedValue(null);

    await expect(usersService.deleteUser(admin, "nope")).rejects.toMatchObject({
      status: 404,
    });
  });
});
