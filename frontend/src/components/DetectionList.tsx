import type { Detection } from "../listener/detector";

interface DetectionListProps {
  detections: Detection[];
  startedAtMs: number;
}

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
            <td>
              {detection.isBeacon
                ? detection.isSweep
                  ? "ביקון (סריקה)"
                  : "ביקון"
                : "רעש"}
            </td>
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
