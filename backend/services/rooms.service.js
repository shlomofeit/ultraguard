import { roomsRepo } from "../repositories/rooms.repo.js";
import { roomSchema, validateSchema } from "../utils/validation.js";

function toRoom(row) {
  const room = {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };

  return room;
}

async function getRooms() {
  const rows = await roomsRepo.getRooms();
  const rooms = rows.map((row) => toRoom(row));

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

export const roomsService = { getRooms, createRoom, updateRoom, deleteRoom };
