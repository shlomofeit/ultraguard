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
        if (toast.kind === "message") {
          return (
            <div key={toast.id} className="toast message">
              <span className="edge" />
              <div className="title">✓ {toast.text}</div>
              <button
                className="close"
                aria-label="סגור"
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
          );
        }
        if (toast.kind === "alert") {
          return (
            <div key={toast.id} className="toast alert">
              <span className="edge" />
              <div>
                <div className="title">🔴 {toast.text}</div>
                <div className="meta">אף מכשיר בחדר לא שולח דופק</div>
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
        }
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
