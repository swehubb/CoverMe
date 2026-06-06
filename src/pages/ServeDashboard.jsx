import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FeatureCard from '../components/shared/FeatureCard';
import ORDCountdown from '../components/shared/ORDCountdown';
import ServiceProfile from '../components/shared/ServiceProfile';
import { calculateORD } from '../utils/ordCalculator';

const FEATURE_CARDS = [
  {
    title: 'IPPT Tracker',
    description: 'Log attempts, track progression, and close the gap to your goal.',
    eyebrow: 'Performance',
    to: '/serve/ippt',
  },
  {
    title: 'Sentinel',
    description: 'Daily wellness journaling with NLP sentiment analysis.',
    eyebrow: 'Mental Health',
    to: '/serve/journal',
  },
  {
    title: 'Buddy Tap',
    description: 'Anonymous concern flag for a fellow NSF who needs support.',
    eyebrow: 'Peer Welfare',
    to: '/serve/buddy-tap',
  },
  {
    title: 'Peer Support Wall',
    description: 'Named posts by phase and topic from your unit community.',
    eyebrow: 'Community',
    to: '/serve/peer-wall',
  },
];

export default function ServeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return <p className="kicker">Loading... faster than your 2.4km.</p>;
  }

  const { currentWeek } = calculateORD(user.enlistmentDate);

  // Use user.ordDate when available; otherwise derive from enlistment + 24 months
  const ordDate = user.ordDate ?? (() => {
    const d = new Date(user.enlistmentDate);
    d.setMonth(d.getMonth() + 24);
    return d.toISOString().slice(0, 10);
  })();

  const serviceUser = {
    pes:  user.pes  ?? user.pesStatus ?? 'B1',
    unit: user.unit ?? '—',
    name: user.name ?? user.fullName ?? '—',
    nric: user.nric ?? '—',
    rank: user.rank ?? '—',
  };

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Module 2 · Serve</p>
        <h1>Serve Dashboard</h1>
        <div className="rule" />
      </header>

      <ServiceProfile user={serviceUser} />

      <div
        className="mini-panel"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface-primary)',
          marginTop: '8px',
          marginBottom: '12px',
          padding: '12px 16px',
        }}
      >
        <span>Week of NS</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>Week {currentWeek}</strong>
      </div>

      <div className="dashboard-hero" style={{ marginBottom: '16px' }}>
        <ORDCountdown
          enlistmentDate={user.enlistmentDate}
          ordDate={ordDate}
          label="DAYS TO ORD"
        />
      </div>

      <div className="grid-cards">
        {FEATURE_CARDS.map((card) => (
          <FeatureCard
            key={card.title}
            title={card.title}
            description={card.description}
            eyebrow={card.eyebrow}
            onClick={() => navigate(card.to)}
          />
        ))}
      </div>
    </section>
  );
}
