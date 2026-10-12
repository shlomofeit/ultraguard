interface StatCardProps {
  label: string;
  value: string;
  note: string;
  isHot?: boolean;
  trend?: number[];
}

const StatCard = ({ label, value, note, isHot, trend }: StatCardProps) => {
  const max = Math.max(1, ...(trend ?? []));

  return (
    <div className={isHot ? "glass stat hot" : "glass stat"}>
      <span>{label}</span>
      <div className="stat-value">
        <strong dir="ltr">{value}</strong>
        {trend && (
          <div className="trend" dir="ltr">
            {trend.map((count, index) => (
              <i key={index} style={{ height: `${(count / max) * 100}%` }} />
            ))}
          </div>
        )}
      </div>
      <em>{note}</em>
    </div>
  );
};

export default StatCard;
