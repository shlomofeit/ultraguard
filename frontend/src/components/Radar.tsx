import type { CSSProperties } from "react";
import { getDetectionType, type PipelineDetection } from "../listener/pipeline";
import { EVENT_TYPE_COLORS } from "../utils/eventTypeColors";
import { toShare } from "../utils/frequencyRange";

interface RadarProps {
  detections: PipelineDetection[];
  isListening: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

const MAX_BLIPS = 12;
const MAX_SNR_DB = 40;

const getBlipStyle = (detection: PipelineDetection) => {
  const angle = toShare(detection.peakFreqHz) * 2 * Math.PI - Math.PI / 2;
  const strength = Math.min(1, detection.maxSnrDb / MAX_SNR_DB);
  const radius = 0.15 + strength * 0.3;
  const { type } = getDetectionType(detection);
  return {
    left: `${50 + Math.cos(angle) * radius * 100}%`,
    top: `${50 + Math.sin(angle) * radius * 100}%`,
    "--c": EVENT_TYPE_COLORS[type],
  } as CSSProperties;
};

const getButtonText = (isListening: boolean, isLoading: boolean) => {
  if (isLoading) {
    return "מפעיל...";
  }
  return isListening ? "עצור" : "התחל האזנה";
};

const Radar = ({
  detections,
  isListening,
  isLoading,
  onToggle,
}: RadarProps) => {
  return (
    <div className={isListening ? "radar on" : "radar"}>
      <div className="sweep" />
      {detections.slice(0, MAX_BLIPS).map((detection) => (
        <span
          key={`${detection.startMs}-${detection.peakFreqHz}`}
          className="blip"
          style={getBlipStyle(detection)}
        />
      ))}
      <button className="radar-button" onClick={onToggle} disabled={isLoading}>
        {getButtonText(isListening, isLoading)}
      </button>
    </div>
  );
};

export default Radar;
