import crypto from "node:crypto";
import { devicesRepo } from "../repositories/devices.repo.js";
import { roomsRepo } from "../repositories/rooms.repo.js";
import { hashDeviceKey } from "../utils/hashDeviceKey.js";
import {
  createDeviceSchema,
  heartbeatSchema,
  validateSchema,
} from "../utils/validation.js";

const KEY_BYTES = 24;

function toDevice(row) {
  const device = {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    kind: row.kind,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };

  return device;
}

async function getDevices() {
  const rows = await devicesRepo.getDevices();
  const devices = rows.map((row) => toDevice(row));

  return devices;
}

async function createDevice(deviceData) {
  const { roomId, name, kind } = validateSchema(createDeviceSchema, deviceData);
  const room = await roomsRepo.getRoomById(roomId);

  if (!room) {
    const error = new Error("Room not found!");
    error.status = 404;
    throw error;
  }

  const deviceKey = crypto.randomBytes(KEY_BYTES).toString("base64url");
  const row = await devicesRepo.createDevice({
    room_id: roomId,
    name,
    kind,
    key_hash: hashDeviceKey(deviceKey),
  });

  return { device: toDevice(row), deviceKey };
}

function throwNotFound() {
  const error = new Error("Device not found!");
  error.status = 404;
  throw error;
}

async function revokeDevice(id) {
  const row = await devicesRepo.updateDevice(id, {
    revoked_at: new Date().toISOString(),
  });

  if (!row) {
    throwNotFound();
  }

  const device = toDevice(row);
  return device;
}

async function deleteDevice(id) {
  const row = await devicesRepo.deleteDevice(id);

  if (!row) {
    throwNotFound();
  }

  const device = toDevice(row);
  return device;
}

async function getDeviceByKey(deviceKey) {
  if (typeof deviceKey !== "string" || !deviceKey) {
    return null;
  }

  const row = await devicesRepo.getDeviceByKeyHash(hashDeviceKey(deviceKey));

  if (!row || row.revoked_at) {
    return null;
  }

  const device = toDevice(row);
  return device;
}

async function recordHeartbeat(deviceId, heartbeatData) {
  const heartbeat = validateSchema(heartbeatSchema, heartbeatData);
  await devicesRepo.updateDevice(deviceId, {
    last_seen_at: new Date().toISOString(),
  });

  return heartbeat;
}

export const devicesService = {
  getDevices,
  createDevice,
  revokeDevice,
  deleteDevice,
  getDeviceByKey,
  recordHeartbeat,
};
