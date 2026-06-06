export default function Insignia({ branch = 'army', size = 28 }) {
  const props = {
    width: size, height: size, viewBox: '0 0 48 48',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  if (branch === 'navy') return (
    <svg {...props} aria-hidden="true">
      <circle cx="24" cy="11" r="4" />
      <path d="M24 15v23" />
      <path d="M15 21h18" />
      <path d="M11 30c0 7 6 10 13 10s13-3 13-10" />
      <path d="M11 30l-3 3M11 30l4 1M37 30l3 3M37 30l-4 1" />
    </svg>
  );

  if (branch === 'air') return (
    <svg {...props} aria-hidden="true">
      <circle cx="24" cy="24" r="3.4" />
      <path d="M21 24L6 19c0 0 3 6 10 7M27 24l15-5c0 0-3 6-10 7" />
      <path d="M21 25L9 27M27 25l12 2" />
      <path d="M24 21v-7" />
    </svg>
  );

  if (branch === 'dis') return (
    <svg {...props} aria-hidden="true">
      <circle cx="24" cy="24" r="4" />
      <path d="M24 20v-9M24 28v9M20 24h-9M28 24h9" />
      <circle cx="24" cy="9" r="2.2" /><circle cx="24" cy="39" r="2.2" />
      <circle cx="9"  cy="24" r="2.2" /><circle cx="39" cy="24" r="2.2" />
      <path d="M27 21l6-6M21 27l-6 6" />
    </svg>
  );

  // army — crossed rifles (default)
  return (
    <svg {...props} aria-hidden="true">
      <path d="M12 36L34 12" /><path d="M36 36L14 12" />
      <path d="M33 11l4 4M15 11l-4 4" />
      <path d="M20 22l3 3M28 22l-3 3" />
      <circle cx="24" cy="40" r="2" />
    </svg>
  );
}
