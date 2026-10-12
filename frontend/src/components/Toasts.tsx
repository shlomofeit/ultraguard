import type { CSSProperties } from "react";
import { useToastStore } from "../store/toastStore";
import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { EVENT_TYPE_COLORS } from "../utils/eventTypeColors";

const REASON_LABELS = {
  decoded: "חשוד · פוענח",
  "repeated-type": "חשוד · סוג חוזר",
  "repeated-freq": "חשוד · מקור חוזר",
};

const formatKhz = (hz: number) => `${(hz / 1000).toFixed(1)} kHz`;

const Toasts = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toasts">
      {toasts.map((toast) => {
        const color = EVENT_TYPE_COLORS[toast.type];
        return (
          <div key={toast.id} className="toast" style={{ "--c": color } as CSSProperties}>
            <span className="edge" />
            <div>
              <div className="title">
                ⚠ {REASON_LABELS[toast.reason]} · <b>{EVENT_TYPE_LABELS[toast.type]}</b>
              </div>
              <div className="meta">
                <bdi className="mono" dir="ltr">
                  {formatKhz(toast.peakFreqHz)}
                </bdi>{" "}
                · {toast.payload ? `תוכן: "${toast.payload}"` : "ללא תוכן מפוענח"}
              </div>
            </div>
            <button
              className="close"
              aria-label="סגור"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toasts;
