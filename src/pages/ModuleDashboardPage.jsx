import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import FeatureCard from '../components/shared/FeatureCard';
import ORDCountdown from '../components/shared/ORDCountdown';
import ServiceProfile from '../components/shared/ServiceProfile';
import { useAuth } from '../contexts/AuthContext';

const moduleContent = {
  enlist: {
    title: 'Enlist Dashboard',
    description: 'Prep, orient, and collect community intel before the next phase starts.',
    features: [
      { title: 'What To Expect', description: 'Sample enlistment milestones and first-week guidance.', path: '/what-to-expect' },
      { title: 'Peer Intel', description: 'Veteran notes and practical tips organised by vocation and intake.', path: '/peer-intel' },
      { title: 'AI Chat', description: 'Guided answers for enlistment, admin, training, and medical questions.', path: '/ai-chat' },
    ],
  },
  serve: {
    title: 'Serve Dashboard',
    description: 'Track progress, reflect, and keep platoon support tools in one place.',
    features: [
      { title: 'Fitness Prep', description: 'IPPT preparation and route planning calibrated to your service profile.', path: '/fitness-prep' },
      { title: 'Journal', description: 'Private nightly reflections with a trend graph only you can see.', path: '/journal' },
      { title: 'Buddy Tap', description: 'Anonymous concern check-ins that help cover a mate early.', path: '/buddy-tap' },
      { title: 'Peer Support Wall', description: 'Support posts by phase and topic with resources surfaced before posting.', path: '/peer-support' },
      { title: 'Train', description: 'IPPT attempts, personal bests, award bands, and platoon training activity.', path: '/train' },
      { title: 'Weekend Planner', description: 'Two-day service-prep plans shaped around your IPPT target and vocation.', path: '/weekend-planner' },
    ],
  },
};

export default function ModuleDashboardPage({ module }) {
  const navigate = useNavigate();
  const { user, setCurrentModule } = useAuth();
  const content = moduleContent[module];

  useEffect(() => {
    setCurrentModule(module);
  }, [module, setCurrentModule]);

  return (
    <PageWrapper title={content.title} description={content.description} module={module}>
      <div className="stack">
        <div className="grid-2">
          <ORDCountdown enlistmentDate={user.enlistmentDate} ordDate={user.ordDate} />
          <ServiceProfile user={user} />
        </div>
        <section className="feature-grid">
          {content.features.map((feature) => (
            <FeatureCard
              key={feature.path}
              title={feature.title}
              description={feature.description}
              onClick={() => navigate(feature.path)}
            />
          ))}
        </section>
      </div>
    </PageWrapper>
  );
}
