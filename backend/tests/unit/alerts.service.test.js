import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALERT_GRACE_MS,
  alertsService,
} from "../../services/alerts.service.js";
import { alertsRepo } from "../../repositories/alerts.repo.js";
import { roomsService } from "../../services/rooms.service.js";
import { telegramService } from "../../services/telegram.service.js";

vi.mock("../../repositories/alerts.repo.js", () => ({
  alertsRepo: {
    getAlerts: vi.fn(),
    getAlertById: vi.fn(),
    createAlert: vi.fn(),
    updateAlert: vi.fn(),
  },
}));

vi.mock("../../services/rooms.service.js", () => ({
  roomsService: { getAllowedRoomIds: vi.fn(), canAccessRoom: vi.fn() },
}));

vi.mock("../../services/telegram.service.js", () => ({
  telegramService: { sendMessage: vi.fn() },
}));

const viewer = { id: "viewer-1", role: "viewer" };

const alertRow = {
  id: "alert-1",
  room_id: "room-1",
  type: "room_silent",
  message: 'החדר "Lab" הפסיק לדווח',
  created_at: "2026-10-13T08:00:00.000Z",
  read_at: null,
};

const roomStatus = (roomId, state) => ({ roomId, roomName: "Lab", state });

const afterGraceMs = () => Date.now() + ALERT_GRACE_MS;

describe("alertsService", () => {
  beforeEach(() => {
    vi.mocked(alertsRepo.createAlert).mockReset();
    vi.mocked(alertsRepo.updateAlert).mockReset();
    vi.mocked(telegramService.sendMessage).mockReset();
    vi.mocked(alertsRepo.createAlert).mockImplementation(async (row) => ({
      ...alertRow,
      ...row,
    }));
  });

  it("shows a viewer only the alerts of their rooms", async () => {
    vi.mocked(roomsService.getAllowedRoomIds).mockResolvedValue(["room-1"]);
    vi.mocked(alertsRepo.getAlerts).mockResolvedValue([alertRow]);

    const alerts = await alertsService.getAlerts(viewer);

    expect(alertsRepo.getAlerts).toHaveBeenCalledWith(["room-1"]);
    expect(alerts[0]).toEqual({
      id: "alert-1",
      roomId: "room-1",
      type: "room_silent",
      message: 'החדר "Lab" הפסיק לדווח',
      createdAt: "2026-10-13T08:00:00.000Z",
      readAt: null,
    });
  });

  it("marks an alert as read", async () => {
    vi.mocked(alertsRepo.getAlertById).mockResolvedValue(alertRow);
    vi.mocked(roomsService.canAccessRoom).mockResolvedValue(true);
    vi.mocked(alertsRepo.updateAlert).mockResolvedValue({
      ...alertRow,
      read_at: "2026-10-13T08:05:00.000Z",
    });

    const alert = await alertsService.markAlertRead("alert-1", viewer);

    expect(alert.readAt).toBe("2026-10-13T08:05:00.000Z");
  });

  it("hides an alert of another room with status 404", async () => {
    vi.mocked(alertsRepo.getAlertById).mockResolvedValue(alertRow);
    vi.mocked(roomsService.canAccessRoom).mockResolvedValue(false);

    await expect(
      alertsService.markAlertRead("alert-1", viewer),
    ).rejects.toMatchObject({ status: 404 });
    expect(alertsRepo.updateAlert).not.toHaveBeenCalled();
  });

  it("does not alert in the first minute after the server starts", async () => {
    const alert = await alertsService.createStatusAlert(
      roomStatus("room-grace", "silent"),
      Date.now(),
    );

    expect(alert).toBeNull();
    expect(alertsRepo.createAlert).not.toHaveBeenCalled();
  });

  it("alerts once when a room goes silent and once when it is back", async () => {
    const silent = await alertsService.createStatusAlert(
      roomStatus("room-a", "silent"),
      afterGraceMs(),
    );
    const stillSilent = await alertsService.createStatusAlert(
      roomStatus("room-a", "silent"),
      afterGraceMs(),
    );
    const back = await alertsService.createStatusAlert(
      roomStatus("room-a", "active"),
      afterGraceMs(),
    );

    expect(silent.type).toBe("room_silent");
    expect(stillSilent).toBeNull();
    expect(back.type).toBe("room_back");
    expect(back.message).toBe('החדר "Lab" חזר לדווח');
    expect(telegramService.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("does not alert about an active room or a room without devices", async () => {
    const active = await alertsService.createStatusAlert(
      roomStatus("room-b", "active"),
      afterGraceMs(),
    );
    const empty = await alertsService.createStatusAlert(
      roomStatus("room-c", "no-devices"),
      afterGraceMs(),
    );

    expect(active).toBeNull();
    expect(empty).toBeNull();
  });

  it("does not say a room is back when its devices were removed", async () => {
    await alertsService.createStatusAlert(
      roomStatus("room-d", "silent"),
      afterGraceMs(),
    );

    const alert = await alertsService.createStatusAlert(
      roomStatus("room-d", "no-devices"),
      afterGraceMs(),
    );

    expect(alert).toBeNull();
    expect(alertsRepo.createAlert).toHaveBeenCalledTimes(1);
  });
});
