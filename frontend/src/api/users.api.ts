import axios from "axios";
import type { ManagedUser, UserRole } from "../types/user";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export const getUsers = async (): Promise<ManagedUser[]> => {
  const { data } = await axios.get<ManagedUser[]>(BASE_URL, {
    withCredentials: true,
  });
  return data;
};

export const updateUserRooms = async (
  id: string,
  roomIds: string[],
): Promise<ManagedUser> => {
  const { data } = await axios.put<ManagedUser>(
    `${BASE_URL}/${id}/rooms`,
    { roomIds },
    { withCredentials: true },
  );
  return data;
};

export const updateUserRole = async (
  id: string,
  role: UserRole,
): Promise<ManagedUser> => {
  const { data } = await axios.patch<ManagedUser>(
    `${BASE_URL}/${id}/role`,
    { role },
    { withCredentials: true },
  );
  return data;
};
