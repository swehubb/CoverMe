import { useState } from 'react';

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
  gridColor = '#1C1C1C',
  textColor = '#5A5A5A',
  goalLabel = 'GOAL',
  onDotClick,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

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

  const tooltip = hoveredIdx !== null && vals[hoveredIdx] != null ? (() => {
    const cx = xOf(hoveredIdx);
    const cy = yOf(vals[hoveredIdx]);
    const label = fmt(vals[hoveredIdx]);
    const tw = Math.max(label.length * 3 + 20, 28);
    const tx = Math.max(pad + tw / 2, Math.min(W - pad - tw / 2, cx));
    return { cx, cy, label, tw, tx };
  })() : null;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad} x2={W - pad} y1={yOf(g)} y2={yOf(g)} stroke={gridColor} strokeWidth="1" />
          <text x={pad - 8} y={yOf(g) + 3} textAnchor="end" fontSize="9" fill={textColor} fontFamily="var(--font-body)">{fmt(g)}</text>
        </g>
      ))}

      {goal != null && (
        <>
          <line
            x1={pad} x2={W - pad} y1={yOf(goal)} y2={yOf(goal)}
            stroke="var(--accent-text)" strokeWidth="1" strokeDasharray="4 4" opacity="0.8"
          />
          <text
            x={W - pad - 6} y={yOf(goal) - 4}
            textAnchor="end" fontSize="8" fill="var(--accent-text)"
            fontFamily="var(--font-mono)" fontWeight="600" opacity="0.75" letterSpacing="0.05em"
          >
            {goalLabel}
          </text>
        </>
      )}

      <path d={areaD} fill="url(#lc-fill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />

      {vals.map((v, i) => (
        <circle
          key={i}
          cx={xOf(i)}
          cy={yOf(v)}
          r={hoveredIdx === i ? 5 : 3}
          fill={hoveredIdx === i ? color : 'var(--bg)'}
          stroke={color}
          strokeWidth="1.6"
          style={{ cursor: onDotClick ? 'pointer' : 'default' }}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          onClick={() => onDotClick?.(i)}
        />
      ))}

      {tooltip && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={tooltip.tx - tooltip.tw / 2} y={tooltip.cy - 30}
            width={tooltip.tw} height={18} rx={1.5}
            fill="#111" stroke="#2a2a2a" strokeWidth={0.5} opacity={0.94}
          />
          <text
            x={tooltip.tx} y={tooltip.cy - 21}
            textAnchor="middle" fontSize="5"
            fill="#c8c8c8" fontFamily="var(--font-mono)" fontWeight="600"
            letterSpacing="0.12em"
          >
            SCORE
          </text>
          <text
            x={tooltip.tx} y={tooltip.cy - 13}
            textAnchor="middle" fontSize="6"
            fill="#555" fontFamily="var(--font-mono)" fontWeight="500"
            letterSpacing="0.10em"
          >
            {tooltip.label}
          </text>
        </g>
      )}
    </svg>
  );
}
