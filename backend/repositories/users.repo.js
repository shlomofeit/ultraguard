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

async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateUser(id, changes) {
  const { data, error } = await supabase
    .from('users')
    .update(changes)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deleteUser(id) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const usersRepo = {
  getUserByEmail,
  getUserById,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
