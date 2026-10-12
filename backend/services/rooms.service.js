import { roomsRepo } from "../repositories/rooms.repo.js";
import { createRoomSchema, validateSchema } from "../utils/validation.js";

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

async function createRoom(roomData) {
  const { name } = validateSchema(createRoomSchema, roomData);
  const existingRoom = await roomsRepo.getRoomByName(name);

  if (existingRoom) {
    const error = new Error("Room name is already taken!");
    error.status = 409;
    throw error;
  }

  const row = await roomsRepo.createRoom({ name });
  const room = toRoom(row);

  return room;
}

export const roomsService = { getRooms, createRoom };
