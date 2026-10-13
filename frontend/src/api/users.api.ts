import axios from "axios";
import type { ManagedUser, ManagedUserInput } from "../types/user";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export const getUsers = async (): Promise<ManagedUser[]> => {
  const { data } = await axios.get<ManagedUser[]>(BASE_URL, {
    withCredentials: true,
  });
  return data;
};

export const updateUser = async (
  id: string,
  input: ManagedUserInput,
): Promise<ManagedUser> => {
  const { data } = await axios.put<ManagedUser>(`${BASE_URL}/${id}`, input, {
    withCredentials: true,
  });
  return data;
};

export const deleteUser = async (id: string): Promise<ManagedUser> => {
  const { data } = await axios.delete<ManagedUser>(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return data;
};
