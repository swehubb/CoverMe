import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import FeatureCard from '../components/shared/FeatureCard';
import ORDCountdown from '../components/shared/ORDCountdown';
import ServiceProfile from '../components/shared/ServiceProfile';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, currentModule, setCurrentModule } = useAuth();
  const { ipptLogs, journalEntries, wallPosts, intelPosts } = useAppContext();

  return (
    <PageWrapper
      title="Home"
      description="A shared landing view into both modules, with the same global style system and common cards."
      module={currentModule}
    >
      <div className="stack">
        <section className="card home-banner">
          <div className="section-label">Overview</div>
          <p className="card-copy">
            {user.name} is currently set to the <strong>{currentModule}</strong> module. Use the tabs or the module cards
            below to move through the service journey.
          </p>
        </section>
        <div className="grid-2">
          <ORDCountdown enlistmentDate={user.enlistmentDate} ordDate={user.ordDate} />
          <ServiceProfile user={user} />
        </div>
        <section className="metric-grid">
          <div className="card metric-card">
            <div className="metric-label">IPPT Logs</div>
            <div className="metric-value">{ipptLogs.length}</div>
          </div>
          <div className="card metric-card">
            <div className="metric-label">Journal Entries</div>
            <div className="metric-value">{journalEntries.length}</div>
          </div>
          <div className="card metric-card">
            <div className="metric-label">Wall Posts</div>
            <div className="metric-value">{wallPosts.length}</div>
          </div>
          <div className="card metric-card">
            <div className="metric-label">Intel Posts</div>
            <div className="metric-value">{intelPosts.length}</div>
          </div>
        </section>
        <section className="feature-grid">
          <FeatureCard
            title="Open Enlist Module"
            description="Switch the active module and head to the enlist dashboard."
            onClick={() => {
              setCurrentModule('enlist');
              navigate('/enlist');
            }}
          />
          <FeatureCard
            title="Open Serve Module"
            description="Switch the active module and head to the serve dashboard."
            onClick={() => {
              setCurrentModule('serve');
              navigate('/serve');
            }}
          />
          <FeatureCard
            title="View Profile"
            description="Check the mock Singpass profile and service details."
            onClick={() => navigate('/profile')}
          />
        </section>
      </div>
    </PageWrapper>
  );
}
