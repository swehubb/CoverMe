import { useNavigate } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import Stat from '../components/ui/Stat';
import Insignia from '../components/shared/Insignia';

function getToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function addYears(ds, y) {
  const d = new Date(ds);
  d.setFullYear(d.getFullYear() + y);
  return d;
}
function daysBetween(from, to) {
  const t = to instanceof Date ? to : new Date(to);
  return Math.max(0, Math.ceil((t - from) / 86400000));
}
function toTitleCase(t) {
  return t.toLowerCase().split(' ').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const FEATURES = [
  { id: 'expect',  path: '/what-to-expect', glyph: '▤', label: 'WHAT TO EXPECT',      desc: 'Reporting flow, packing checklist, first-day schedule, key NS terminology.' },
  { id: 'fitness', path: '/enlist/workout',  glyph: '▲', label: 'PES-BASED FITNESS',    desc: 'AI-calibrated weekly plan, live workout logger, and your training streak — tuned to your PES.' },
  { id: 'chat',    path: '/ai-chat',        glyph: '◈', label: 'AI CHATBOT',            desc: 'Retrieval-only SAF answers. Sourced from ns.sg and mindef.gov.sg exclusively.' },
  { id: 'intel',   path: '/peer-intel',     glyph: '⊕', label: 'PEER INTEL FEED',      desc: 'Verified experiences from veterans, organised by vocation and batch.' },
];

export default function EnlistDashboardPage({ state, updateState, phase }) {
  const navigate = useNavigate();
  const profile = state.auth.profile;
  const today = getToday();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(today, ordDate);
  const enlistDays = daysBetween(today, profile.enlistmentDate);
  const firstName = toTitleCase(profile.fullName.split(' ')[1] || profile.fullName.split(' ')[0]);
  const attempts = state.ippt.attempts;
  const latestIppt = attempts.length ? attempts[attempts.length - 1] : null;
  const latestScore = latestIppt ? (() => {
    const p = Math.min(25, Math.floor(latestIppt.pushups / 2));
    const s = Math.min(25, Math.floor(latestIppt.situps / 2));
    const r = Math.max(0, Math.min(50, Math.round((900 - latestIppt.runSeconds) / 6)));
    return Math.max(0, Math.min(100, p + s + r));
  })() : null;
  const ordPct = Math.min(100, Math.round(((730 - ordDays) / 730) * 100));

  return (
    <div className="dash-page">
      {/* Header */}
      <Panel ticks elevated style={{ padding: 26, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 30, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 12 }}>ENLIST MODULE · PRE-SERVICE PREP</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
              <Insignia branch={state.ui.branch || 'army'} size={28} />
            </div>
            <div>
              <div className="h-display" style={{ fontSize: 22 }}>
                {toTitleCase(profile.fullName)}
              </div>
              <div className="mono-dim" style={{ color: 'var(--text-dim)' }}>
                {profile.pesStatus} · {profile.unit} · {(profile.vocation || 'INFANTRY').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 30 }}>
          <div className="label" style={{ marginBottom: 8 }}>ORD COUNTDOWN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="stat-val" style={{ fontSize: 56, color: 'var(--amber)' }}>{ordDays}</span>
            <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 14 }}>DAYS REMAINING</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
            <div style={{ width: `${ordPct}%`, height: '100%', background: 'var(--accent-2)' }} />
          </div>
          <div className="mono-dim" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span>ENLISTING IN {enlistDays} DAYS</span>
            <span>{ordPct}% COMPLETE</span>
          </div>
        </div>
      </Panel>

      {/* Readiness band */}
      <Panel flush style={{ marginBottom: 16, padding: '18px 26px' }}>
        <div className="readiness-band">
          <Stat label="IPPT GOAL" value={(state.onboarding.ipptGoal || '—').toUpperCase()} size={28} color="var(--text)" />
          <Stat label="LATEST SCORE" value={latestScore ?? '—'} unit={latestScore != null ? 'PTS' : undefined} size={28} />
          <Stat label="PES STATUS" value={profile.pesStatus} size={28} color="var(--text)" />
          <Stat label="ENLIST IN" value={enlistDays} unit="D" size={28} />
        </div>
      </Panel>

      {/* Feature grid */}
      <div className="label" style={{ margin: '24px 0 12px' }}>MODULE DECK</div>
      <div className="dash-features-grid">
        {FEATURES.map((f) => (
          <button key={f.id} className="feat-card" onClick={() => navigate(f.path)}>
            <Panel className="feat-card-inner" style={{ gap: 0 }}>
              <div style={{ marginTop: 'auto' }}>
                <div className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>{f.label}</div>
                <div className="feature-card-copy" style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>{f.desc}</div>
                <span className="feat-card-arrow">Open →</span>
              </div>
            </Panel>
          </button>
        ))}
      </div>
    </div>
  );
}
