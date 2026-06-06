export default function Insignia({ size = 28 }) {
  return (
    <svg
      aria-hidden="true"
      className="insignia"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 36 34 12" />
      <path d="M36 36 14 12" />
      <path d="m33 11 4 4M15 11l-4 4" />
      <path d="m20 22 3 3M28 22l-3 3" />
      <circle cx="24" cy="40" r="2" />
    </svg>
  );
}
