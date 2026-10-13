import { beforeEach, describe, expect, it, vi } from "vitest";
import { roomsService } from "../../services/rooms.service.js";
import { roomsRepo } from "../../repositories/rooms.repo.js";
import { roomMembersRepo } from "../../repositories/roomMembers.repo.js";

vi.mock("../../repositories/rooms.repo.js", () => ({
  roomsRepo: {
    getRooms: vi.fn(),
    getRoomByName: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
  },
}));

vi.mock("../../repositories/roomMembers.repo.js", () => ({
  roomMembersRepo: { getRoomIdsByUser: vi.fn() },
}));

vi.mock("../../repositories/events.repo.js", () => ({ eventsRepo: {} }));

vi.mock("../../services/devices.service.js", () => ({ devicesService: {} }));

const admin = { id: "admin-1", role: "admin" };
const viewer = { id: "viewer-1", role: "viewer" };

const roomRow = {
  id: "room-1",
  name: "Lab",
  created_at: "2026-10-11T08:00:00.000Z",
};

describe("roomsService", () => {
  beforeEach(() => {
    vi.mocked(roomsRepo.getRoomByName).mockReset();
    vi.mocked(roomsRepo.createRoom).mockReset();
    vi.mocked(roomsRepo.updateRoom).mockReset();
    vi.mocked(roomsRepo.deleteRoom).mockReset();
  });

  it("shows every room to an admin", async () => {
    vi.mocked(roomsRepo.getRooms).mockResolvedValue([
      roomRow,
      { ...roomRow, id: "room-2" },
    ]);

    const rooms = await roomsService.getRooms(admin);

    expect(rooms).toHaveLength(2);
    expect(roomMembersRepo.getRoomIdsByUser).not.toHaveBeenCalled();
  });

  it("shows a viewer only the rooms given to them", async () => {
    vi.mocked(roomsRepo.getRooms).mockResolvedValue([
      roomRow,
      { ...roomRow, id: "room-2" },
    ]);
    vi.mocked(roomMembersRepo.getRoomIdsByUser).mockResolvedValue(["room-2"]);

    const rooms = await roomsService.getRooms(viewer);

    expect(rooms.map((room) => room.id)).toEqual(["room-2"]);
  });

  it("checks if a user can watch a room", async () => {
    vi.mocked(roomMembersRepo.getRoomIdsByUser).mockResolvedValue(["room-1"]);

    expect(await roomsService.canAccessRoom(admin, "room-9")).toBe(true);
    expect(await roomsService.canAccessRoom(viewer, "room-1")).toBe(true);
    expect(await roomsService.canAccessRoom(viewer, "room-9")).toBe(false);
  });

  it("creates a room with a free name", async () => {
    vi.mocked(roomsRepo.getRoomByName).mockResolvedValue(null);
    vi.mocked(roomsRepo.createRoom).mockResolvedValue(roomRow);

    const room = await roomsService.createRoom({ name: "  Lab " });

    expect(roomsRepo.createRoom).toHaveBeenCalledWith({ name: "Lab" });
    expect(room).toEqual({
      id: "room-1",
      name: "Lab",
      createdAt: "2026-10-11T08:00:00.000Z",
    });
  });

  it("renames a room", async () => {
    vi.mocked(roomsRepo.getRoomByName).mockResolvedValue(null);
    vi.mocked(roomsRepo.updateRoom).mockResolvedValue({
      ...roomRow,
      name: "Class 7",
    });

    const room = await roomsService.updateRoom("room-1", { name: "Class 7" });

    expect(roomsRepo.updateRoom).toHaveBeenCalledWith("room-1", {
      name: "Class 7",
    });
    expect(room.name).toBe("Class 7");
  });

  it("lets a room keep its own name", async () => {
    vi.mocked(roomsRepo.getRoomByName).mockResolvedValue(roomRow);
    vi.mocked(roomsRepo.updateRoom).mockResolvedValue(roomRow);

    const room = await roomsService.updateRoom("room-1", { name: "Lab" });

    expect(room.name).toBe("Lab");
  });

  it("rejects a name that another room uses with status 409", async () => {
    vi.mocked(roomsRepo.getRoomByName).mockResolvedValue({
      ...roomRow,
      id: "room-2",
    });

    await expect(
      roomsService.updateRoom("room-1", { name: "Lab" }),
    ).rejects.toMatchObject({ status: 409 });
    expect(roomsRepo.updateRoom).not.toHaveBeenCalled();
  });

  it("rejects a name that is too short with status 400", async () => {
    await expect(
      roomsService.updateRoom("room-1", { name: "A" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects renaming a missing room with status 404", async () => {
    vi.mocked(roomsRepo.getRoomByName).mockResolvedValue(null);
    vi.mocked(roomsRepo.updateRoom).mockResolvedValue(null);

    await expect(
      roomsService.updateRoom("nope", { name: "Class 7" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("deletes a room", async () => {
    vi.mocked(roomsRepo.deleteRoom).mockResolvedValue(roomRow);

    const room = await roomsService.deleteRoom("room-1");

    expect(roomsRepo.deleteRoom).toHaveBeenCalledWith("room-1");
    expect(room.id).toBe("room-1");
  });

  it("rejects deleting a missing room with status 404", async () => {
    vi.mocked(roomsRepo.deleteRoom).mockResolvedValue(null);

    await expect(roomsService.deleteRoom("nope")).rejects.toMatchObject({
      status: 404,
    });
  });

  describe("getRoomState", () => {
    const room = { id: "room-1", name: "Lab" };
    const device = (id, changes) => ({
      id,
      roomId: "room-1",
      lastSeenAt: null,
      revokedAt: null,
      ...changes,
    });

    it("is active when a device in the room reports", () => {
      const devices = [device("device-1"), device("device-2")];

      const roomState = roomsService.getRoomState(room, devices, {
        activeDevices: 1,
      });

      expect(roomState).toMatchObject({
        state: "active",
        activeDevices: 1,
        totalDevices: 2,
      });
    });

    it("is silent when the room has devices but none reports", () => {
      const devices = [
        device("device-1", { lastSeenAt: "2026-10-13T08:00:00.000Z" }),
        device("device-2", { lastSeenAt: "2026-10-13T09:30:00.000Z" }),
      ];

      const roomState = roomsService.getRoomState(room, devices, {
        activeDevices: 0,
      });

      expect(roomState.state).toBe("silent");
      expect(roomState.lastSeenAt).toBe("2026-10-13T09:30:00.000Z");
    });

    it("has no devices when the room has only revoked or other devices", () => {
      const devices = [
        device("device-1", { revokedAt: "2026-10-13T08:00:00.000Z" }),
        device("device-2", { roomId: "room-2" }),
      ];

      const roomState = roomsService.getRoomState(room, devices, {
        activeDevices: 0,
      });

      expect(roomState).toMatchObject({
        state: "no-devices",
        totalDevices: 0,
        lastSeenAt: null,
      });
    });
  });
});
