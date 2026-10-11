import { supabase } from '../config/supabase.js';

async function getRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const roomsRepo = { getRooms };
