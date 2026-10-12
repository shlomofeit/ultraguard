import { Link } from "react-router-dom";
import LiveWave from "./LiveWave";

interface ListeningBarProps {
  isOnline: boolean;
  analyser: AnalyserNode | null;
  detectionsCount: number;
  suspiciousCount: number;
  onStop: () => void;
}

const ListeningBar = ({
  isOnline,
  analyser,
  detectionsCount,
  suspiciousCount,
  onStop,
}: ListeningBarProps) => {
  return (
    <aside className="listening-bar">
      <span className={isOnline ? "live on" : "live"}>
        <LiveWave analyser={analyser} />
        {isOnline ? "מאזין, מחובר לשרת" : "מאזין, אין חיבור לשרת"}
      </span>
      <span className="note">
        {detectionsCount} גילויים · {suspiciousCount} חשודים
      </span>
      <Link to="/listen">למסך ההאזנה</Link>
      <button onClick={onStop}>עצור</button>
    </aside>
  );
};

export default ListeningBar;
