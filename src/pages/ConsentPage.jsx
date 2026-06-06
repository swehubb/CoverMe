import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Panel from '../components/ui/Panel';

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      className={`toggle ${on ? 'on' : 'off'}`}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export default function ConsentPage({ state, updateState }) {
  const navigate = useNavigate();
  const [optIn, setOptIn] = useState(true);
  const [reminder, setReminder] = useState(true);

  if (!state.auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (state.onboarding.consented)  return <Navigate to="/home" replace />;

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

  const proceed = () => {
    updateState((current) => ({
      ...current,
      onboarding: { ...current.onboarding, consented: true, journalOptIn: optIn },
    }));
    navigate('/home');
  };

  return (
    <div className="consent-page" data-branch="army">
      <div className="consent-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
          <div className="label" style={{ color: 'var(--accent-text)' }}>▲ STEP 03 / 03 · SENTINEL WELLNESS LAYER</div>
          <div className="step-rail">
            {stepChip(1, 'PROFILE', false, true)}
            {stepChip(2, 'OBJECTIVE', false, true)}
            {stepChip(3, 'WELLNESS', true, false)}
          </div>
        </div>

        <h1 className="h-display" style={{ fontSize: 72, marginBottom: 10 }}>YOUR MIND IS PART OF THE MISSION</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 720, marginBottom: 40 }}>
          Sentinel is a private nightly journal that tracks how you're really doing — visible only to you.
          It's opt-in, encrypted, and you control every escalation. Nothing reaches your chain of command.
        </p>

        <div className="consent-grid">
          <Panel ticks elevated style={{ padding: 34 }}>
            <div style={{ fontSize: 34, color: 'var(--accent-text)', marginBottom: 18 }}>◈</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                ['ENCRYPTED & PRIVATE', 'Entries are encrypted end-to-end. No commander, peer leader, or admin can ever read them.'],
                ['TRANSPARENT TO YOU',  'You see the exact same sentiment trend the system computes — no hidden scoring.'],
                ['YOU OWN ESCALATION',  'If your trend dips, the terminal surfaces support options. You decide what happens, every time.'],
                ['PDPA COMPLIANT',      'Retained for your service duration only. Deleted the moment you ask.'],
              ].map(([t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ color: 'var(--accent-text)', marginTop: 2 }}>◈</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, letterSpacing: '0.03em' }}>{t}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 14.5, lineHeight: 1.5 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Panel style={{ padding: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, letterSpacing: '0.03em' }}>ENABLE SENTINEL</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>Turn on the nightly wellness journal & private trend graph.</div>
                </div>
                <Toggle on={optIn} onChange={setOptIn} />
              </div>
              <div className="hr" style={{ margin: '0 0 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, opacity: optIn ? 1 : 0.45 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, letterSpacing: '0.03em' }}>EVENING REMINDER</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>A quiet 2100h nudge to log your reflection.</div>
                </div>
                <Toggle on={reminder} onChange={setReminder} disabled={!optIn} />
              </div>
            </Panel>
            <Panel flush style={{ padding: '18px 22px', background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
                <b style={{ fontFamily: 'var(--font-head)', letterSpacing: '0.03em' }}>You can change this anytime.</b>
                {' '}<span style={{ color: 'var(--text-dim)' }}>Enable or disable Sentinel from your profile whenever you want.</span>
              </p>
            </Panel>
            <button className="btn lg full" onClick={proceed}>
              {optIn ? 'ENABLE & ENTER TERMINAL →' : 'SKIP & ENTER TERMINAL →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
