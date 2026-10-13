import { usersRepo } from "../repositories/users.repo.js";
import { roomMembersRepo } from "../repositories/roomMembers.repo.js";
import { updateUserSchema, validateSchema } from "../utils/validation.js";

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

async function updateUser(currentUser, id, userData) {
  const { name, role, roomIds } = validateSchema(updateUserSchema, userData);

  if (currentUser.id === id && role !== "admin") {
    const error = new Error("You can't remove your own admin role!");
    error.status = 400;
    throw error;
  }

  const row = await usersRepo.updateUser(id, { name, role });

  if (!row) {
    throwNotFound();
  }

  const uniqueRoomIds = [...new Set(roomIds)];
  await roomMembersRepo.replaceUserRooms(id, uniqueRoomIds);

  const user = toUser(row, uniqueRoomIds);
  return user;
}

async function deleteUser(currentUser, id) {
  if (currentUser.id === id) {
    const error = new Error("You can't delete yourself!");
    error.status = 400;
    throw error;
  }

  const row = await usersRepo.deleteUser(id);

  if (!row) {
    throwNotFound();
  }

  const user = toUser(row, []);
  return user;
}

export const usersService = { getUsers, updateUser, deleteUser };
