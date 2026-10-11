import type { EventType } from "../types/event";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  silverpush: "SilverPush",
  lisnr: "LISNR",
  mosquito: "Mosquito",
  chirp: "סריקה (Chirp)",
  tone: "צליל קבוע",
  unknown: "ביקון לא מזוהה",
  noise: "רעש",
};
