import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import Award from '../components/ui/Award';
import Stat from '../components/ui/Stat';

const GOAL_TIERS = [
  { key: 'Pass', label: 'PASS', range: '51 - 60 points', award: '$0', sub: 'Meet the standard' },
  { key: 'Pass with Incentive', label: 'PASS WITH INCENTIVE', range: '61 - 74 points', award: '$200', sub: 'Meet the incentive band' },
  { key: 'Silver', label: 'SILVER', range: '75 - 84 points', award: '$300', sub: 'Above standard' },
  { key: 'Gold', label: 'GOLD', range: '≥ 85 points', award: '$500', sub: 'Peak conditioning' },
];

export default function GoalSetupPage({ state, updateState }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(state.onboarding.ipptGoal || 'Gold');

  if (!state.auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (state.onboarding.ipptGoal && state.onboarding.consented) return <Navigate to="/home" replace />;

  const profile = state.auth.profile;

  const confirm = () => {
    if (!selected) return;
    updateState((current) => ({
      ...current,
      onboarding: { ...current.onboarding, ipptGoal: selected },
    }));
    navigate('/setup/consent');
  };

  const stepChip = (n, label, active, done) => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="step-chip" style={{
          border: `1px solid ${active || done ? 'var(--accent-line)' : 'var(--border-strong)'}`,
          background: active ? 'var(--accent)' : done ? 'var(--accent-soft)' : 'transparent',
          color: active ? '#fff' : done ? 'var(--accent-text)' : 'var(--text-faint)',
        }}>
          {done ? '✓' : `0${n}`}
        </span>
        <span style={{
          fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em',
          color: active ? 'var(--text)' : 'var(--text-faint)',
        }}>{label}</span>
      </div>
      {n < 3 && <span className="step-conn" />}
    </>
  );

  return (
    <div className="setup-page" data-branch="army">
      <div className="setup-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div className="label" style={{ color: 'var(--accent-text)' }}>▲ STEP 02 / 03 · MISSION OBJECTIVE</div>
          <div className="step-rail">
            {stepChip(1, 'PROFILE', false, true)}
            {stepChip(2, 'OBJECTIVE', true, false)}
            {stepChip(3, 'WELLNESS', false, false)}
          </div>
        </div>

        <h1 className="h-display" style={{ fontSize: 76, marginBottom: 10 }}>SET YOUR IPPT TARGET</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 680, marginBottom: 44 }}>
          Your objective calibrates every weekend plan and session the terminal generates. You can recalibrate anytime from your profile.
        </p>

        <div className="goal-grid">
          {GOAL_TIERS.map((tier) => {
            const active = selected === tier.key;
            return (
              <button key={tier.key} className="goal-card" onClick={() => setSelected(tier.key)}>
                <Panel
                  ticks={active}
                  elevated={active}
                  className="goal-card-inner"
                  style={{
                    borderLeftColor: active ? 'var(--accent)' : 'var(--border)',
                    borderColor: active ? 'var(--accent-line)' : 'var(--border)',
                    background: active ? 'var(--accent-soft)' : 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <Award award={tier.key} />
                    <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      border: `2px solid ${active ? 'var(--accent-text)' : 'var(--border-strong)'}` }}>
                      {active && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-text)' }} />}
                    </span>
                  </div>
                  <div className="goal-pts goal-pts-range">
                    {tier.range}
                  </div>
                  <div className="h-title goal-tier-title">{tier.label}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 15, marginTop: 4 }}>{tier.sub}</div>
                  <div className="hr" style={{ margin: '20px 0 14px' }} />
                  <div className="mono-dim" style={{ color: 'var(--accent-text)', fontSize: 12.5 }}>AWARD · {tier.award}</div>
                </Panel>
              </button>
            );
          })}
        </div>

        <Panel flush style={{ padding: 0 }}>
          <div className="goal-footer-bar">
            <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
              <Stat label="YOUR PES STATUS" value={profile?.pesStatus || 'B1'} size={26} color="var(--text)" />
              <div style={{ width: 1, height: 38, background: 'var(--border)' }} />
              <Stat label="VOCATION" value={(profile?.vocation || 'INFANTRY').toUpperCase()} size={26} color="var(--text)" />
              <div style={{ width: 1, height: 38, background: 'var(--border)' }} />
              <Stat label="SELECTED" value={selected.toUpperCase()} size={26} color="var(--amber)" />
            </div>
            <button className="btn lg" onClick={confirm}>CONFIRM OBJECTIVE →</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
