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
      { title: 'Peer Intel', description: 'Veteran notes and practical tips collected into the demo database.', path: '/peer-intel' },
      { title: 'AI Chat', description: 'A placeholder route for the guided helper flow.', path: '/ai-chat' },
    ],
  },
  serve: {
    title: 'Serve Dashboard',
    description: 'Track progress, reflect, and keep platoon support tools in one place.',
    features: [
      { title: 'Fitness Prep', description: 'IPPT logs live in AppContext and can be extended from this route.', path: '/fitness-prep' },
      { title: 'Journal', description: 'Daily reflections backed by the shared journal entries array.', path: '/journal' },
      { title: 'Buddy Tap', description: 'Peer support check-ins tied to the platoon sample data.', path: '/buddy-tap' },
      { title: 'Peer Support Wall', description: 'Anonymous-style support posts stored in the shared wall state.', path: '/peer-support' },
      { title: 'Train', description: 'Training feed seeded from the mock data source.', path: '/train' },
      { title: 'Weekend Planner', description: 'A simple route for weekend prep and reset planning.', path: '/weekend-planner' },
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
