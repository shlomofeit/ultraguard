import { roomsRepo } from '../repositories/rooms.repo.js';

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

export const roomsService = { getRooms };
