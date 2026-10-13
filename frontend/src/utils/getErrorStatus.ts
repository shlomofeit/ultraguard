import axios from "axios";

export const getErrorStatus = (err: unknown): number | null => {
  if (axios.isAxiosError(err) && err.response) {
    return err.response.status;
  }
  return null;
};
