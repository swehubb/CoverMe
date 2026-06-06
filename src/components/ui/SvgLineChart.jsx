export default function SvgLineChart({
  data,
  accessor = (d) => d,
  height = 180,
  yMax,
  yMin = 0,
  fmt = (v) => v,
  pad = 28,
  color = 'var(--amber)',
  goal,
}) {
  const W = 560;
  const H = height;
  const vals = data.map(accessor);
  const max = yMax != null ? yMax : Math.max(...vals) * 1.1 || 1;
  const min = yMin;

  const xOf = (i) => pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
  const yOf = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);

  const pathD = vals.map((v, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${xOf(vals.length - 1).toFixed(1)} ${H - pad} L${xOf(0).toFixed(1)} ${H - pad} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad} x2={W - pad} y1={yOf(g)} y2={yOf(g)} stroke="#1C1C1C" strokeWidth="1" />
          <text x={pad - 8} y={yOf(g) + 3} textAnchor="end" fontSize="9" fill="#5A5A5A" fontFamily="var(--font-mono)">{fmt(g)}</text>
        </g>
      ))}
      {goal != null && (
        <line x1={pad} x2={W - pad} y1={yOf(goal)} y2={yOf(goal)}
          stroke="var(--accent-text)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
      )}
      <path d={areaD} fill="url(#lc-fill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
      {vals.map((v, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3"
          fill="var(--bg)" stroke={color} strokeWidth="1.6" />
      ))}
    </svg>
  );
}
