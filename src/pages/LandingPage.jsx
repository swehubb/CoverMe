import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/setup/goal" replace />;
  }

  const handleLogin = async () => {
    try {
      await login();
      navigate('/setup/goal');
    } catch {
      setError('Mock Singpass login failed. Please try again.');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <div className="hero-panel">
          <div className="stack">
            <div className="hero-kicker">NS Demo Flow</div>
            <h1 className="hero-title">Cover Me</h1>
            <p className="page-description">
              A single service journey scaffold with two modules: one for enlisting, one for serving.
            </p>
          </div>
          <ul className="hero-list">
            <li>Mock Singpass OIDC entry point</li>
            <li>Shared demo data and app-wide contexts</li>
            <li>17-route flow aligned to your checklist</li>
          </ul>
        </div>
        <div className="auth-panel">
          <div className="stack">
            <div className="section-label">Authentication</div>
            <h2 className="feature-card-title">Continue with Singpass</h2>
            <p className="card-copy">
              This mock login returns the demo user profile for Wei and routes into the onboarding flow.
            </p>
          </div>
          <button type="button" className="button-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Redirecting...' : 'Log In With Singpass'}
          </button>
          {error ? <p className="muted-text">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
