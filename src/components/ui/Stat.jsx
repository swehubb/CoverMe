export default function Stat({ label, value, unit, size = 32, color }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-val" style={{ fontSize: size, color }}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
    </div>
  );
}
