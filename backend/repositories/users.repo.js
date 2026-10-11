import { supabase } from '../config/supabase.js';

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function createUser(row) {
  const { data, error } = await supabase
    .from('users')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const usersRepo = { getUserByEmail, getUserById, createUser };
