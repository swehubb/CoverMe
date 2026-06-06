import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ORDCountdown from '../components/shared/ORDCountdown';
import FeatureCard from '../components/shared/FeatureCard';
import { useAppContext } from '../contexts/AppContext';
import { addYears, daysBetween, getToday, getWeekOfNs, toTitleCase } from './shared/appScreenUtils';

const DETAIL_BLOCKS = [
  {
    title: 'IPPT Tracker',
    body: 'Log attempts, set goals, and follow an adaptive training roadmap with clear benchmarks.',
    to: '/train',
  },
  {
    title: 'Sentinel',
    body: 'Wellness journaling with NLP sentiment analysis and a user-controlled escalation ladder.',
    to: '/journal',
  },
  {
    title: 'Buddy Tap',
    body: 'Anonymous single-action concern flag. Three independent taps trigger a direct supportive message.',
    to: '/buddy-tap',
  },
  {
    title: 'Peer Support Wall',
    body: 'Named support posts by phase and topic, with resources surfaced before anything goes live.',
    to: '/peer-support',
  },
  {
    title: 'Support Options',
    body: 'User-controlled escalation: AI companion, peer support leader, or SAF counselling. You decide, every time.',
    to: '/escalation',
  },
];

export default function ServeDashboardPage({ state, phase }) {
  const navigate = useNavigate();
  const { activeModule, setActiveModule } = useAppContext();
  const profile = state.auth.profile;
  const firstName = profile.fullName.split(' ')[1] || profile.fullName.split(' ')[0];
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);
  const weekOfNs = getWeekOfNs(profile.enlistmentDate);

  useEffect(() => {
    if (activeModule !== 'serve') {
      setActiveModule('serve');
    }
  }, [activeModule, setActiveModule]);

  return (
    <section className="dashboard-page">
      <header className="screen-header dashboard-page-header">
        <p className="kicker">Module 2 · Serve</p>
        <h1>Welcome back, {toTitleCase(firstName)}</h1>
        <p className="dashboard-summary">
          Four interconnected features support physical performance, mental wellness, and peer solidarity throughout active service.
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
            <span>Week of NS</span>
            <strong>{phase === 'serve' ? `Week ${weekOfNs}` : 'Preview · Week 1'}</strong>
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
        {DETAIL_BLOCKS.map((block) => (
          <FeatureCard
            key={block.title}
            title={block.title}
            description={block.body}
            eyebrow="Serve Feature"
            onClick={() => navigate(block.to)}
          />
        ))}
      </div>
    </section>
  );
}
