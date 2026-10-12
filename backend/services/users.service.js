import { usersRepo } from "../repositories/users.repo.js";
import { roomMembersRepo } from "../repositories/roomMembers.repo.js";
import {
  userRoleSchema,
  userRoomsSchema,
  validateSchema,
} from "../utils/validation.js";

function toUser(row, roomIds) {
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    roomIds,
  };

  return user;
}

function throwNotFound() {
  const error = new Error("User not found!");
  error.status = 404;
  throw error;
}

async function getUsers() {
  const [rows, members] = await Promise.all([
    usersRepo.getUsers(),
    roomMembersRepo.getMembers(),
  ]);
  const users = rows.map((row) => {
    const roomIds = members
      .filter((member) => member.user_id === row.id)
      .map((member) => member.room_id);
    return toUser(row, roomIds);
  });

  return users;
}

async function setUserRooms(id, roomsData) {
  const { roomIds } = validateSchema(userRoomsSchema, roomsData);
  const row = await usersRepo.getUserById(id);

  if (!row) {
    throwNotFound();
  }

  const uniqueRoomIds = [...new Set(roomIds)];
  await roomMembersRepo.replaceUserRooms(id, uniqueRoomIds);

  const user = toUser(row, uniqueRoomIds);
  return user;
}

async function setUserRole(currentUser, id, roleData) {
  const { role } = validateSchema(userRoleSchema, roleData);

  if (currentUser.id === id && role !== "admin") {
    const error = new Error("You can't remove your own admin role!");
    error.status = 400;
    throw error;
  }

  const row = await usersRepo.updateUser(id, { role });

  if (!row) {
    throwNotFound();
  }

  const roomIds = await roomMembersRepo.getRoomIdsByUser(id);
  const user = toUser(row, roomIds);
  return user;
}

export const usersService = { getUsers, setUserRooms, setUserRole };
