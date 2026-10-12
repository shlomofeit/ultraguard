import { supabase } from "../config/supabase.js";

async function getRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getRoomById(id) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getRoomByName(name) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function createRoom(row) {
  const { data, error } = await supabase
    .from("rooms")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const roomsRepo = { getRooms, getRoomById, getRoomByName, createRoom };
