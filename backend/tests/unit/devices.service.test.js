import { beforeEach, describe, expect, it, vi } from "vitest";
import { devicesService } from "../../services/devices.service.js";
import { devicesRepo } from "../../repositories/devices.repo.js";
import { roomsRepo } from "../../repositories/rooms.repo.js";
import { hashDeviceKey } from "../../utils/hashDeviceKey.js";

vi.mock("../../repositories/devices.repo.js", () => ({
  devicesRepo: {
    getDevices: vi.fn(),
    getDeviceByKeyHash: vi.fn(),
    createDevice: vi.fn(),
    updateDevice: vi.fn(),
  },
}));

vi.mock("../../repositories/rooms.repo.js", () => ({
  roomsRepo: { getRoomById: vi.fn() },
}));

const ROOM_ID = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

const deviceRow = {
  id: "device-1",
  room_id: ROOM_ID,
  name: "Lab laptop",
  kind: "browser",
  key_hash: "hash",
  last_seen_at: null,
  revoked_at: null,
  created_at: "2026-10-11T08:00:00.000Z",
};

describe("devicesService", () => {
  beforeEach(() => {
    vi.mocked(devicesRepo.getDeviceByKeyHash).mockReset();
    vi.mocked(devicesRepo.createDevice).mockReset();
    vi.mocked(devicesRepo.updateDevice).mockReset();
    vi.mocked(roomsRepo.getRoomById).mockReset();
  });

  it("saves only the hash of a new key and returns the key once", async () => {
    vi.mocked(roomsRepo.getRoomById).mockResolvedValue({ id: ROOM_ID });
    vi.mocked(devicesRepo.createDevice).mockImplementation(async (row) => ({
      ...deviceRow,
      key_hash: row.key_hash,
    }));

    const { device, deviceKey } = await devicesService.createDevice({
      roomId: ROOM_ID,
      name: "Lab laptop",
      kind: "browser",
    });

    const row = vi.mocked(devicesRepo.createDevice).mock.calls[0][0];
    expect(deviceKey.length).toBeGreaterThanOrEqual(32);
    expect(row.key_hash).toBe(hashDeviceKey(deviceKey));
    expect(row).not.toHaveProperty("deviceKey");
    expect(device).not.toHaveProperty("keyHash");
  });

  it("rejects a device for a room that does not exist with status 404", async () => {
    vi.mocked(roomsRepo.getRoomById).mockResolvedValue(null);

    await expect(
      devicesService.createDevice({
        roomId: ROOM_ID,
        name: "Lab laptop",
        kind: "browser",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(devicesRepo.createDevice).not.toHaveBeenCalled();
  });

  it("finds a device by its key", async () => {
    vi.mocked(devicesRepo.getDeviceByKeyHash).mockResolvedValue(deviceRow);

    const device = await devicesService.getDeviceByKey("some-key");

    expect(devicesRepo.getDeviceByKeyHash).toHaveBeenCalledWith(
      hashDeviceKey("some-key"),
    );
    expect(device.roomId).toBe(ROOM_ID);
  });

  it("does not accept a revoked device or a missing key", async () => {
    vi.mocked(devicesRepo.getDeviceByKeyHash).mockResolvedValue({
      ...deviceRow,
      revoked_at: "2026-10-11T09:00:00.000Z",
    });

    expect(await devicesService.getDeviceByKey("some-key")).toBeNull();
    expect(await devicesService.getDeviceByKey(undefined)).toBeNull();
  });

  it("rejects a broken heartbeat with status 400", async () => {
    await expect(
      devicesService.recordHeartbeat("device-1", { sentAt: "yesterday" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(devicesRepo.updateDevice).not.toHaveBeenCalled();
  });
});
