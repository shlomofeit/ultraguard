import crypto from "node:crypto";
import { devicesRepo } from "../repositories/devices.repo.js";
import { roomsRepo } from "../repositories/rooms.repo.js";
import { hashDeviceKey } from "../utils/hashDeviceKey.js";
import {
  createDeviceSchema,
  heartbeatSchema,
  updateDeviceSchema,
  validateSchema,
  verifyDeviceKeySchema,
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

async function checkRoomExists(roomId) {
  const room = await roomsRepo.getRoomById(roomId);

  if (!room) {
    const error = new Error("Room not found!");
    error.status = 404;
    throw error;
  }
}

function createDeviceKey() {
  const deviceKey = crypto.randomBytes(KEY_BYTES).toString("base64url");

  return deviceKey;
}

async function createDevice(deviceData) {
  const { roomId, name, kind } = validateSchema(createDeviceSchema, deviceData);
  await checkRoomExists(roomId);

  const deviceKey = createDeviceKey();
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

async function updateDevice(id, deviceData) {
  const { roomId, name } = validateSchema(updateDeviceSchema, deviceData);
  await checkRoomExists(roomId);

  const row = await devicesRepo.updateDevice(id, { room_id: roomId, name });

  if (!row) {
    throwNotFound();
  }

  const device = toDevice(row);
  return device;
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

async function replaceDeviceKey(id) {
  const deviceKey = createDeviceKey();
  const row = await devicesRepo.updateDevice(id, {
    key_hash: hashDeviceKey(deviceKey),
    revoked_at: null,
  });

  if (!row) {
    throwNotFound();
  }

  return { device: toDevice(row), deviceKey };
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

async function verifyDeviceKey(keyData) {
  const { deviceKey } = validateSchema(verifyDeviceKeySchema, keyData);
  const row = await devicesRepo.getDeviceByKeyHash(hashDeviceKey(deviceKey));

  if (!row) {
    const error = new Error("Device key not found!");
    error.status = 404;
    throw error;
  }

  if (row.revoked_at) {
    const error = new Error("Device key was revoked!");
    error.status = 403;
    throw error;
  }

  const room = await roomsRepo.getRoomById(row.room_id);
  const keyInfo = { deviceName: row.name, roomName: room.name };

  return keyInfo;
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
  updateDevice,
  revokeDevice,
  replaceDeviceKey,
  deleteDevice,
  getDeviceByKey,
  verifyDeviceKey,
  recordHeartbeat,
};
