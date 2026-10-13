const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const formatTimeAgo = (iso: string | null, nowMs: number): string => {
  if (!iso) {
    return "לא התחבר";
  }
  const passedMs = nowMs - new Date(iso).getTime();
  if (passedMs < MINUTE_MS) {
    return "עכשיו";
  }
  if (passedMs < HOUR_MS) {
    const minutes = Math.floor(passedMs / MINUTE_MS);
    return minutes === 1 ? "לפני דקה" : `לפני ${minutes} דקות`;
  }
  if (passedMs < DAY_MS) {
    const hours = Math.floor(passedMs / HOUR_MS);
    if (hours === 1) return "לפני שעה";
    if (hours === 2) return "לפני שעתיים";
    return `לפני ${hours} שעות`;
  }
  const days = Math.floor(passedMs / DAY_MS);
  if (days === 1) return "אתמול";
  if (days === 2) return "לפני יומיים";
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
};
