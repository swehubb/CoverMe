import { calculateORD } from '../../data/utils/ordCalculator';

export default function ORDCountdown({ enlistmentDate, ordDate, value, label = 'Days To ORD' }) {
  const { daysToORD, percentComplete } = calculateORD(enlistmentDate, ordDate);
  const displayValue = value ?? daysToORD;

  return (
    <section className="card countdown-card shared-countdown-card">
      <div className="section-label">ORD Countdown</div>
      <div className="shared-countdown-value">
        <span className="countdown-number">{displayValue}</span>
        <span className="shared-countdown-label">{label}</span>
      </div>
      <div className="countdown-subtext">{percentComplete}% of the journey completed.</div>
    </section>
  );
}
