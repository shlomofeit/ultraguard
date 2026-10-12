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

async function getEvents(filter) {
  let query = supabase
    .from('events')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(filter.limit);

  if (filter.roomId) {
    query = query.eq('room_id', filter.roomId);
  }
  if (filter.type) {
    query = query.eq('type', filter.type);
  }
  if (filter.from) {
    query = query.gte('started_at', filter.from);
  }
  if (filter.to) {
    query = query.lte('started_at', filter.to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const eventsRepo = { createEvent, getEvents };
