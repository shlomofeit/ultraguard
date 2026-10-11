import { supabase } from '../config/supabase.js';

async function createEvent(row) {
  const { data, error } = await supabase
    .from('events')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const eventsRepo = { createEvent };
