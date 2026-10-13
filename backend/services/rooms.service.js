import { roomsRepo } from "../repositories/rooms.repo.js";
import { roomMembersRepo } from "../repositories/roomMembers.repo.js";
import { eventsRepo } from "../repositories/events.repo.js";
import { devicesService } from "./devices.service.js";
import { presenceService } from "./presence.service.js";
import { roomSchema, validateSchema } from "../utils/validation.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function toRoom(row) {
  const room = {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };

  return room;
}

async function getAllowedRoomIds(user) {
  if (user.role === "admin") {
    return null;
  }

  const roomIds = await roomMembersRepo.getRoomIdsByUser(user.id);
  return roomIds;
}

async function canAccessRoom(user, roomId) {
  const allowedRoomIds = await getAllowedRoomIds(user);

  return allowedRoomIds === null || allowedRoomIds.includes(roomId);
}

async function getRooms(user) {
  const rows = await roomsRepo.getRooms();
  const allowedRoomIds = await getAllowedRoomIds(user);
  const visibleRows =
    allowedRoomIds === null
      ? rows
      : rows.filter((row) => allowedRoomIds.includes(row.id));
  const rooms = visibleRows.map((row) => toRoom(row));

  return rooms;
}

function getRoomState(room, devices, presence) {
  const roomDevices = devices.filter(
    (device) => device.roomId === room.id && !device.revokedAt,
  );
  const seenTimes = roomDevices
    .map((device) => device.lastSeenAt)
    .filter((lastSeenAt) => lastSeenAt)
    .sort();

  let state = "silent";
  if (roomDevices.length === 0) {
    state = "no-devices";
  } else if (presence.activeDevices > 0) {
    state = "active";
  }

  const roomState = {
    roomId: room.id,
    roomName: room.name,
    state,
    activeDevices: presence.activeDevices,
    totalDevices: roomDevices.length,
    lastSeenAt: seenTimes.at(-1) ?? null,
  };

  return roomState;
}

async function buildRoomStatus(room, devices, nowMs) {
  const presence = presenceService.getRoomStatus(room.id, nowMs);
  const roomState = getRoomState(room, devices, presence);
  const since = new Date(nowMs - DAY_MS).toISOString();
  const [eventsLastDay, lastEvent] = await Promise.all([
    eventsRepo.countEventsSince(room.id, since),
    eventsRepo.getLastEvent(room.id),
  ]);

  const roomStatus = {
    ...roomState,
    eventsLastDay,
    lastEventAt: lastEvent?.started_at ?? null,
    lastEventType: lastEvent?.type ?? null,
  };

  return roomStatus;
}

async function getStatuses(rooms) {
  const devices = await devicesService.getDevices();
  const nowMs = Date.now();
  const statuses = await Promise.all(
    rooms.map((room) => buildRoomStatus(room, devices, nowMs)),
  );

  return statuses;
}

async function getRoomsStatus(user) {
  const rooms = await getRooms(user);
  const statuses = await getStatuses(rooms);

  return statuses;
}

async function getAllRoomsStatus() {
  const rows = await roomsRepo.getRooms();
  const statuses = await getStatuses(rows.map((row) => toRoom(row)));

  return statuses;
}

async function getRoomStatus(roomId) {
  const row = await roomsRepo.getRoomById(roomId);

  if (!row) {
    return null;
  }

  const [roomStatus] = await getStatuses([toRoom(row)]);
  return roomStatus;
}

function throwNotFound() {
  const error = new Error("Room not found!");
  error.status = 404;
  throw error;
}

async function checkNameIsFree(name, roomId) {
  const existingRoom = await roomsRepo.getRoomByName(name);

  if (existingRoom && existingRoom.id !== roomId) {
    const error = new Error("Room name is already taken!");
    error.status = 409;
    throw error;
  }
}

async function createRoom(roomData) {
  const { name } = validateSchema(roomSchema, roomData);
  await checkNameIsFree(name, null);

  const row = await roomsRepo.createRoom({ name });
  const room = toRoom(row);

  return room;
}

async function updateRoom(id, roomData) {
  const { name } = validateSchema(roomSchema, roomData);
  await checkNameIsFree(name, id);

  const row = await roomsRepo.updateRoom(id, { name });

  if (!row) {
    throwNotFound();
  }

  const room = toRoom(row);
  return room;
}

async function deleteRoom(id) {
  const row = await roomsRepo.deleteRoom(id);

  if (!row) {
    throwNotFound();
  }

  const room = toRoom(row);
  return room;
}

export const roomsService = {
  getAllowedRoomIds,
  canAccessRoom,
  getRooms,
  getRoomState,
  getRoomsStatus,
  getAllRoomsStatus,
  getRoomStatus,
  createRoom,
  updateRoom,
  deleteRoom,
};
