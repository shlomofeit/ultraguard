import type { SuspicionReason } from "../listener/suspicion";

export const SUSPICION_LABELS: Record<SuspicionReason, string> = {
  decoded: "חשוד – פוענח",
  "repeated-type": "חשוד – חוזר",
  "repeated-freq": "חשוד – חוזר",
};
