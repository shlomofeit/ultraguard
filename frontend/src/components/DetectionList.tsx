import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { SUSPICION_LABELS } from "../utils/suspicionLabels";
import { getDetectionType, type CheckedDetection } from "../listener/pipeline";

interface DetectionListProps {
  detections: CheckedDetection[];
  startedAtMs: number;
}

const getTypeLabel = (detection: CheckedDetection) => {
  const { type, confidence } = getDetectionType(detection);
  if (type === "noise") {
    return EVENT_TYPE_LABELS.noise;
  }
  return `${EVENT_TYPE_LABELS[type]} (${Math.round(confidence * 100)}%)`;
};

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString("he-IL");

const DetectionList = ({ detections, startedAtMs }: DetectionListProps) => {
  if (detections.length === 0) {
    return <p className="empty">עדיין לא זוהה כלום</p>;
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
          <th>תוכן</th>
          <th>סטטוס</th>
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
            <td dir="auto">{detection.payload ?? "–"}</td>
            <td>
              {detection.suspicion
                ? SUSPICION_LABELS[detection.suspicion]
                : "נבדק, לא חשוד"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DetectionList;
