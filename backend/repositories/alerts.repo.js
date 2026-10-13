import { supabase } from "../config/supabase.js";

const ALERTS_LIMIT = 50;

async function getAlerts(roomIds) {
  let query = supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ALERTS_LIMIT);

  if (roomIds) {
    query = query.in("room_id", roomIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAlertById(id) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function createAlert(row) {
  const { data, error } = await supabase
    .from("alerts")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateAlert(id, changes) {
  const { data, error } = await supabase
    .from("alerts")
    .update(changes)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const alertsRepo = { getAlerts, getAlertById, createAlert, updateAlert };
