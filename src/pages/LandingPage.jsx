import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Insignia from '../components/shared/Insignia';
import Panel from '../components/ui/Panel';

function normalizeProfile(profile) {
  if (!profile) return null;
  const rawName = profile.fullName || profile.name;
  const fullName = !rawName || rawName.toUpperCase() === 'WEI' ? 'Tan An Wei' : rawName;
  const pesStatus = profile.pesStatus || profile.pes || 'B1';
  return {
    ...profile,
    fullName,
    name: fullName,
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
    if (state.auth.isAuthenticated) navigate('/setup/goal', { replace: true });
  }, [navigate, state.auth.isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    const profile = normalizeProfile(await login());
    updateState((current) => ({
      ...current,
      auth: { isAuthenticated: true, profile },
    }));
    navigate('/setup/goal');
    setLoading(false);
  };

  return (
    <div className="auth-page" data-branch="army">
      <div className="auth-left">
        <div className="auth-brand-row">
          <Insignia branch="army" size={26} />
          <span className="auth-brand-label">SAF · LAND FORCE · TERMINAL ACCESS</span>
        </div>
        <div className="fade-up">
          <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 14 }}>
            ▲ NATIONAL SERVICE COMMAND TERMINAL
          </div>
          <h1 className="h-display auth-hero-title">COVER<br />ME</h1>
          <p className="auth-subtext">
            Your personal command terminal for the full NS journey — track conditioning,
            own your wellbeing, and cover the mates beside you.
          </p>
        </div>
        <div className="auth-footer">
          <span>SECURE CHANNEL</span>
          <span style={{ color: 'var(--success)' }}><span className="blink">●</span> ONLINE</span>
        </div>
      </div>

      <div className="auth-right">
        <Panel ticks elevated style={{ padding: 36 }} className="fade-up">
          <span className="label" style={{ marginBottom: 6 }}>▲ AUTHENTICATION REQUIRED</span>
          <h2 className="h-title" style={{ fontSize: 38, marginBottom: 8 }}>SECURE ACCESS</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 28 }}>
            Verify your identity with Singpass to access your service profile.
            All session data is encrypted end-to-end.
          </p>
          <button className="singpass-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'ESTABLISHING LINK…' : 'LOG IN WITH SINGPASS'}
          </button>
          <div className="hr" style={{ margin: '26px 0 18px' }} />
          <div className="auth-trust-list">
            {[
              ['SINGPASS VERIFIED', 'Name, NRIC, PES & enlistment pulled securely'],
              ['NO PASSWORDS STORED', 'Government-grade identity, zero credentials held'],
              ['PDPA COMPLIANT', 'Wellness data deleted on request, retained for service only'],
            ].map(([title, desc]) => (
              <div key={title} className="auth-trust-item">
                <span className="auth-trust-icon">◈</span>
                <div>
                  <div className="auth-trust-title">{title}</div>
                  <div className="auth-trust-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
