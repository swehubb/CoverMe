import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';

export default function ConsentPage() {
  const navigate = useNavigate();
  const { currentModule, updateUser, user } = useAuth();

  const handleConsent = () => {
    updateUser((currentUser) => ({
      ...currentUser,
      consented: true,
    }));
    navigate('/home');
  };

  return (
    <PageWrapper
      title="Consent"
      description="This mock screen stores demo consent on the authenticated user in AuthContext."
      module={currentModule}
    >
      <div className="stack">
        <section className="card">
          <div className="section-label">Data Use</div>
          <p className="card-copy">
            Cover Me stores demo profile, module, and app interaction data locally in memory for the prototype flow.
          </p>
          <div className="pill-row">
            <span className="stat-chip">Goal: {user?.ipptGoal || 'Not set'}</span>
            <span className="stat-chip">Consent: {user?.consented ? 'Given' : 'Pending'}</span>
          </div>
        </section>
        <div className="actions-row">
          <button type="button" className="button-primary" onClick={handleConsent}>
            I Consent
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
