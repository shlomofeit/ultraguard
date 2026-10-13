import { alertsRepo } from "../repositories/alerts.repo.js";
import { roomsService } from "./rooms.service.js";
import { telegramService } from "./telegram.service.js";

export const ALERT_GRACE_MS = 60000;

const serverStartedAtMs = Date.now();
const silentRoomIds = new Set();

function toAlert(row) {
  const alert = {
    id: row.id,
    roomId: row.room_id,
    type: row.type,
    message: row.message,
    createdAt: row.created_at,
    readAt: row.read_at,
  };

  return alert;
}

async function getAlerts(user) {
  const allowedRoomIds = await roomsService.getAllowedRoomIds(user);
  const rows = await alertsRepo.getAlerts(allowedRoomIds);
  const alerts = rows.map((row) => toAlert(row));

  return alerts;
}

async function markAlertRead(id, user) {
  const row = await alertsRepo.getAlertById(id);
  const canRead =
    row && (await roomsService.canAccessRoom(user, row.room_id));

  if (!canRead) {
    const error = new Error("Alert not found!");
    error.status = 404;
    throw error;
  }

  const updatedRow = await alertsRepo.updateAlert(id, {
    read_at: new Date().toISOString(),
  });
  const alert = toAlert(updatedRow);

  return alert;
}

function getStatusAlertType(roomStatus) {
  const wasSilent = silentRoomIds.has(roomStatus.roomId);

  if (roomStatus.state === "silent" && !wasSilent) {
    silentRoomIds.add(roomStatus.roomId);
    return "room_silent";
  }

  if (roomStatus.state !== "silent" && wasSilent) {
    silentRoomIds.delete(roomStatus.roomId);
    return roomStatus.state === "active" ? "room_back" : null;
  }

  return null;
}

function getStatusMessage(type, roomName) {
  if (type === "room_silent") {
    return `החדר "${roomName}" הפסיק לדווח`;
  }
  return `החדר "${roomName}" חזר לדווח`;
}

async function createStatusAlert(roomStatus, nowMs) {
  if (nowMs - serverStartedAtMs < ALERT_GRACE_MS) {
    return null;
  }

  const type = getStatusAlertType(roomStatus);

  if (!type) {
    return null;
  }

  const message = getStatusMessage(type, roomStatus.roomName);
  const row = await alertsRepo.createAlert({
    room_id: roomStatus.roomId,
    type,
    message,
  });
  const icon = type === "room_silent" ? "🔴" : "🟢";
  await telegramService.sendMessage(`${icon} UltraGuard: ${message}`);

  const alert = toAlert(row);
  return alert;
}

export const alertsService = { getAlerts, markAlertRead, createStatusAlert };
