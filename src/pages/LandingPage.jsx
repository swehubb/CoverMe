import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function normalizeProfile(profile) {
  if (!profile) return null;
  const fullName = profile.fullName || profile.name || 'WEI';
  const pesStatus = profile.pesStatus || profile.pes || 'B1';
  return {
    ...profile,
    fullName,
    pesStatus,
    vocation: profile.vocation || (profile.unit?.includes('SIR') ? 'Infantry' : 'General'),
    unit: profile.unit || '3 SIR',
    enlistmentDate: profile.enlistmentDate || '2026-05-01',
  };
}

export default function LandingPage({ state, updateState }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.auth.isAuthenticated) {
      navigate('/setup/goal', { replace: true });
    }
  }, [navigate, state.auth.isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    const profile = normalizeProfile(await login());
    updateState((current) => ({
      ...current,
      auth: {
        isAuthenticated: true,
        profile,
      },
    }));
    navigate('/setup/goal');
    setLoading(false);
  };

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <div className="auth-mark">COVER ME</div>
        <p className="auth-tagline">A clearer NS journey from uncertainty to service readiness.</p>
      </div>
      <div className="auth-panel">
        <p className="kicker">Secure access</p>
        <h1>Log in with Singpass</h1>
        <div className="rule" />
        <p className="auth-copy">
          Sign in once to pull your MINDEF-linked profile and enter the right module for where you
          are in the NS journey.
        </p>
        <button className="singpass-button" onClick={handleLogin} disabled={loading}>
          <span className="singpass-logo">S</span>
          <span>{loading ? 'Connecting...' : 'Log in with Singpass'}</span>
        </button>
      </div>
    </section>
  );
}
