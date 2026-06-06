import Panel from '../components/ui/Panel';
import { preEnlistmentPlans } from '../data/mockWorkoutPlans';

const COMPONENT_LABELS = {
  pushUps: 'Push-ups', sitUps: 'Sit-ups', run: '2.4km Run',
  core: 'Core', recovery: 'Recovery',
};

function fmtEx(ex) {
  const parts = [];
  if (ex.sets && ex.sets > 1) parts.push(`${ex.sets} sets`);
  if (ex.reps) parts.push(typeof ex.reps === 'number' ? `${ex.reps} reps` : ex.reps);
  if (ex.duration) parts.push(ex.duration);
  if (ex.rest) parts.push(`rest ${ex.rest}`);
  return parts.join(' · ');
}

export default function FitnessPrepPage({ state }) {
  const pes = state.auth.profile.pesStatus || 'B1';
  const goal = state.onboarding.ipptGoal || 'Pass';
  const plan = preEnlistmentPlans[pes] || preEnlistmentPlans['B1'];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · PRE-ENLISTMENT CONDITIONING</div>
      <h1 className="h-display" style={{ fontSize: 52, marginBottom: 4 }}>FITNESS PREP</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>
        Plan calibrated to <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{pes}</span> · target <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{goal.toUpperCase()}</span>.
        Each exercise is tagged to the IPPT station it improves.
      </p>

      <div className="prep-week-grid">
        {plan.weeklyPlan.map((day, di) => (
          <Panel key={di}>
            <div className="prep-day-header">
              <div>
                <div className="prep-day-name">{day.day}</div>
                <div className="prep-day-focus">{day.focus}</div>
              </div>
            </div>
            <div>
              {day.exercises.map((ex, ei) => (
                <div key={ei} className="prep-exercise-row">
                  <div>
                    <div className="prep-exercise-name">{ex.name}</div>
                    <div className="prep-exercise-detail">{fmtEx(ex)}</div>
                  </div>
                  <span className={`prep-badge component-${ex.component}`}>
                    {COMPONENT_LABELS[ex.component] || ex.component}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Panel flush style={{ padding: '14px 18px', marginTop: 8, background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}>
        <span className="label" style={{ marginBottom: 4 }}>NOTE</span>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.55 }}>
          Always follow your Medical Officer's guidance if you have medical restrictions.
          PES C and E recruits should adjust intensity accordingly.
        </p>
      </Panel>
    </div>
  );
}
