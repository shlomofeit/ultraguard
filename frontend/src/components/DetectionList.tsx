import type { Detection } from "../listener/detector";
import type { EventType } from "../types/event";
import { classify } from "../listener/classifier";

interface DetectionListProps {
  detections: Detection[];
  startedAtMs: number;
}

const TYPE_LABELS: Record<EventType, string> = {
  silverpush: "SilverPush",
  lisnr: "LISNR",
  mosquito: "Mosquito",
  chirp: "סריקה (Chirp)",
  tone: "צליל קבוע",
  unknown: "ביקון לא מזוהה",
  noise: "רעש",
};

const getTypeLabel = (detection: Detection) => {
  const { type, confidence } = classify(detection);
  if (type === "noise") {
    return TYPE_LABELS.noise;
  }
  return `${TYPE_LABELS[type]} (${Math.round(confidence * 100)}%)`;
};

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString("he-IL");

const DetectionList = ({ detections, startedAtMs }: DetectionListProps) => {
  if (detections.length === 0) {
    return <p>עדיין לא זוהה כלום</p>;
  }

  return (
    <table className="detection-list">
      <thead>
        <tr>
          <th>שעה</th>
          <th>סוג</th>
          <th>תדר שיא</th>
          <th>תדרים</th>
          <th>משך</th>
          <th>SNR</th>
        </tr>
      </thead>
      <tbody>
        {detections.map((detection) => (
          <tr key={`${detection.startMs}-${detection.peakFreqHz}`}>
            <td>{formatTime(startedAtMs + detection.startMs)}</td>
            <td>{getTypeLabel(detection)}</td>
            <td dir="ltr">{detection.peakFreqHz} Hz</td>
            <td dir="ltr">{detection.freqsHz.length}</td>
            <td dir="ltr">{Math.round(detection.durationMs)} ms</td>
            <td dir="ltr">{detection.maxSnrDb.toFixed(0)} dB</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DetectionList;
