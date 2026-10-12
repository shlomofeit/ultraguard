import axios from "axios";

export const getErrorDetails = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  if (err instanceof DOMException && err.name === "NotAllowedError") {
    return "לא התקבלה הרשאה למיקרופון";
  }
  return fallback;
};
