import { roomsRepo } from "../repositories/rooms.repo.js";
import { roomMembersRepo } from "../repositories/roomMembers.repo.js";
import { roomSchema, validateSchema } from "../utils/validation.js";

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
  createRoom,
  updateRoom,
  deleteRoom,
};
