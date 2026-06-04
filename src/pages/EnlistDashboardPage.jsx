import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../components/shared/FeatureCard';
import ORDCountdown from '../components/shared/ORDCountdown';

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addYears(dateString, years) {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function daysBetween(fromDate, toDate) {
  const target = toDate instanceof Date ? toDate : new Date(toDate);
  return Math.max(0, Math.ceil((target - fromDate) / (1000 * 60 * 60 * 24)));
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const FEATURE_CARDS = [
  {
    title: 'What to Expect',
    description:
      'A structured first-look at enlistment day, reporting flow, packing checklist, first-day schedule, and key NS terminology.',
    to: '/what-to-expect',
  },
  {
    title: 'PES-Based Fitness Prep',
    description:
      'Training plans calibrated to your Physical Employment Status and chosen IPPT target, with exercises and component targets.',
    to: '/fitness-prep',
  },
  {
    title: 'AI Chatbot',
    description:
      'Retrieval-only SAF answers for jargon, admin questions, and day-one uncertainty. Sourced from verified SAF documentation.',
    to: '/ai-chat',
  },
  {
    title: 'Peer Intel Feed',
    description:
      'Real batch intel from veterans organised by vocation and intake. Know what helped others before you step through the gates.',
    to: '/peer-intel',
  },
];

export default function EnlistDashboardPage({ state, updateState, phase }) {
  const navigate = useNavigate();
  const profile = state.auth.profile;
  const firstName = toTitleCase(
    profile.fullName.split(' ')[1] || profile.fullName.split(' ')[0],
  );
  const today = getToday();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(today, ordDate);
  const enlistDays = daysBetween(today, profile.enlistmentDate);

  useEffect(() => {
    updateState((current) => {
      if (current.ui.activeModule === 'enlist') return current;
      return { ...current, ui: { ...current.ui, activeModule: 'enlist' } };
    });
  }, [updateState]);

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Module 1 · Enlist</p>
        <h1>Welcome back, {firstName}</h1>
        <div className="rule" />
      </header>

      <div className="dashboard-hero">
        <ORDCountdown
          enlistmentDate={profile.enlistmentDate}
          ordDate={ordDate}
          value={ordDays}
          label="DAYS TO ORD"
        />
        <div className="secondary-stack">
          <div className="mini-panel">
            <span>Enlisting in</span>
            <strong>{enlistDays} days</strong>
          </div>
          <div className="mini-panel">
            <span>Service profile</span>
            <strong>
              PES {profile.pesStatus} · {profile.unit}
            </strong>
          </div>
        </div>
      </div>

      <p className="enlist-dash-summary">
        Built for the pre-enlistee who has zero NS knowledge and maximum uncertainty. Every feature
        reduces a specific anxiety.
      </p>

      <div className="feature-grid">
        {FEATURE_CARDS.map((card) => (
          <FeatureCard
            key={card.title}
            title={card.title}
            description={card.description}
            eyebrow="Enlist Feature"
            onClick={() => navigate(card.to)}
          />
        ))}
      </div>
    </section>
  );
}
