import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../components/shared/FeatureCard';
import ORDCountdown from '../components/shared/ORDCountdown';
import { useAppContext } from '../contexts/AppContext';
import { addYears, daysBetween, getToday, toTitleCase } from './shared/appScreenUtils';

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

export default function EnlistDashboardPage({ state }) {
  const navigate = useNavigate();
  const { activeModule, setActiveModule } = useAppContext();
  const profile = state.auth.profile;
  const firstName = toTitleCase(
    profile.fullName.split(' ')[1] || profile.fullName.split(' ')[0],
  );
  const today = getToday();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(today, ordDate);
  const enlistDays = daysBetween(today, profile.enlistmentDate);

  useEffect(() => {
    if (activeModule !== 'enlist') {
      setActiveModule('enlist');
    }
  }, [activeModule, setActiveModule]);

  return (
    <section className="dashboard-page">
      <header className="screen-header dashboard-page-header">
        <p className="kicker">Module 1 · Enlist</p>
        <h1>Welcome back, {firstName}</h1>
        <p className="dashboard-summary">
          Built for the pre-enlistee who has zero NS knowledge and maximum uncertainty. Every feature
          reduces a specific anxiety.
        </p>
        <div className="rule" />
      </header>

      <div className="dashboard-hero dashboard-hero-balanced">
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
