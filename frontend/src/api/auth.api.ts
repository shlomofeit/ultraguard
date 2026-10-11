import axios from "axios";
import type { LoginInput, RegisterInput, User } from "../types/user";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export const registerUser = async (input: RegisterInput): Promise<User> => {
  const { data } = await axios.post<User>(`${BASE_URL}/register`, input, {
    withCredentials: true,
  });
  return data;
};

export const loginUser = async (input: LoginInput): Promise<User> => {
  const { data } = await axios.post<User>(`${BASE_URL}/login`, input, {
    withCredentials: true,
  });
  return data;
};

export const logoutUser = async (): Promise<void> => {
  await axios.post(`${BASE_URL}/logout`, null, { withCredentials: true });
};

export const getMe = async (): Promise<User> => {
  const { data } = await axios.get<User>(`${BASE_URL}/me`, {
    withCredentials: true,
  });
  return data;
};

export const refreshSession = async (): Promise<User> => {
  const { data } = await axios.post<User>(`${BASE_URL}/refresh`, null, {
    withCredentials: true,
  });
  return data;
};

export const setupSessionRefresh = () => {
  axios.interceptors.response.use(
    (response) => response,
    async (err) => {
      const request = err.config;
      const isExpired = err.response?.status === 401;
      const isAuthUrl = request?.url?.startsWith(BASE_URL);

      if (!isExpired || isAuthUrl || request.isRetry) {
        throw err;
      }

      request.isRetry = true;
      await refreshSession();
      return axios(request);
    },
  );
};
