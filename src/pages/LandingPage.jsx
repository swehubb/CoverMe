import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Insignia from '../components/shared/Insignia';

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
        <div className="auth-terminal-label">
          <Insignia size={26} />
          <span>SAF · LAND FORCE · TERMINAL ACCESS</span>
        </div>
        <div>
          <p className="kicker">⟢ National Service Command Terminal</p>
          <div className="auth-mark">COVER<br />ME</div>
          <p className="auth-tagline">
            Your personal command terminal for the full NS journey. Track conditioning, own your
            wellbeing, and cover the mates beside you.
          </p>
        </div>
        <div className="auth-build">
          <span>BUILD 2.4.0</span>
          <span>SECURE CHANNEL</span>
          <span className="auth-online">● ONLINE</span>
        </div>
      </div>
      <div className="auth-panel">
        <p className="kicker">◢ Authentication required</p>
        <h1>Secure access</h1>
        <p className="auth-copy">
          Verify your identity with Singpass to access your service profile. Your existing session
          and MINDEF-linked profile flow remain unchanged.
        </p>
        <button className="singpass-button" onClick={handleLogin} disabled={loading}>
          <span className="singpass-logo">S</span>
          <span>{loading ? 'Establishing link...' : 'Log in with Singpass'}</span>
        </button>
        <div className="auth-assurances">
          <div><span>▣</span><p><strong>Singpass verified</strong>Name, NRIC, PES and enlistment pulled securely</p></div>
          <div><span>▣</span><p><strong>No passwords stored</strong>Government-grade identity, zero credentials held</p></div>
          <div><span>▣</span><p><strong>PDPA compliant</strong>Wellness data remains under your control</p></div>
        </div>
        <p className="auth-classification">GOVTECH × MINDEF · UNCLASSIFIED · FOR DEMONSTRATION</p>
      </div>
    </section>
  );
}
