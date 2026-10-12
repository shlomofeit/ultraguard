import { supabase } from "../config/supabase.js";

async function getDevices() {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getDeviceByKeyHash(keyHash) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function createDevice(row) {
  const { data, error } = await supabase
    .from("devices")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateDevice(id, changes) {
  const { data, error } = await supabase
    .from("devices")
    .update(changes)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const devicesRepo = {
  getDevices,
  getDeviceByKeyHash,
  createDevice,
  updateDevice,
};
