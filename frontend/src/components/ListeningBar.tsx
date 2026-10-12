import { Link } from "react-router-dom";

interface ListeningBarProps {
  isOnline: boolean;
  detectionsCount: number;
  suspiciousCount: number;
  onStop: () => void;
}

const ListeningBar = ({
  isOnline,
  detectionsCount,
  suspiciousCount,
  onStop,
}: ListeningBarProps) => {
  return (
    <aside className="listening-bar">
      <span className={isOnline ? "live on" : "live"}>
        <span className="live-dot" />
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
