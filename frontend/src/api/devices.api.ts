import axios from "axios";
import type { CreatedDevice, Device, DeviceInput } from "../types/device";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/devices`;

export const getDevices = async (): Promise<Device[]> => {
  const { data } = await axios.get<Device[]>(BASE_URL, {
    withCredentials: true,
  });
  return data;
};

export const createDevice = async (
  input: DeviceInput,
): Promise<CreatedDevice> => {
  const { data } = await axios.post<CreatedDevice>(BASE_URL, input, {
    withCredentials: true,
  });
  return data;
};

export const revokeDevice = async (id: string): Promise<Device> => {
  const { data } = await axios.patch<Device>(`${BASE_URL}/${id}/revoke`, null, {
    withCredentials: true,
  });
  return data;
};

export const deleteDevice = async (id: string): Promise<Device> => {
  const { data } = await axios.delete<Device>(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return data;
};
