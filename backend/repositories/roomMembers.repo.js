import { supabase } from "../config/supabase.js";

async function getMembers() {
  const { data, error } = await supabase.from("room_members").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getRoomIdsByUser(userId) {
  const { data, error } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => row.room_id);
}

async function replaceUserRooms(userId, roomIds) {
  const { error: deleteError } = await supabase
    .from("room_members")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (roomIds.length === 0) {
    return;
  }

  const rows = roomIds.map((roomId) => ({ user_id: userId, room_id: roomId }));
  const { error: insertError } = await supabase.from("room_members").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export const roomMembersRepo = { getMembers, getRoomIdsByUser, replaceUserRooms };
