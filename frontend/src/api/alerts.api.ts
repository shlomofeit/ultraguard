import axios from "axios";
import type { Alert } from "../types/alert";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/alerts`;

export const getAlerts = async (): Promise<Alert[]> => {
  const { data } = await axios.get<Alert[]>(BASE_URL, { withCredentials: true });
  return data;
};

export const markAlertRead = async (id: string): Promise<Alert> => {
  const { data } = await axios.patch<Alert>(`${BASE_URL}/${id}/read`, null, {
    withCredentials: true,
  });
  return data;
};
