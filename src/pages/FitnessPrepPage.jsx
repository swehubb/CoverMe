import { preEnlistmentPlans } from '../data/mockWorkoutPlans';
import { useAppContext } from '../contexts/AppContext';

const COMPONENT_LABELS = {
  pushUps: 'Push-ups',
  sitUps: 'Sit-ups',
  run: '2.4km Run',
  core: 'Core',
  recovery: 'Recovery',
};

function formatExercise(ex) {
  const parts = [];
  if (ex.sets && ex.sets > 1) parts.push(`${ex.sets} sets`);
  if (ex.reps) parts.push(typeof ex.reps === 'number' ? `${ex.reps} reps` : ex.reps);
  if (ex.duration) parts.push(ex.duration);
  if (ex.rest) parts.push(`rest ${ex.rest}`);
  return parts.join(' · ');
}

export default function FitnessPrepPage({ state }) {
  const { ipptGoal } = useAppContext();
  const profile = state.auth.profile;
  const pesStatus = profile.pesStatus || 'B1';
  const goal = ipptGoal || state.onboarding.ipptGoal || 'Pass';

  const plan = preEnlistmentPlans[pesStatus] || preEnlistmentPlans['B1'];

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Enlist · Screen 7</p>
        <h1>Your Pre-Enlistment Plan</h1>
        <p>
          Training plan calibrated to your Physical Employment Status and IPPT target. Each exercise
          is tagged to the IPPT component it improves.
        </p>
        <div className="rule" />
      </header>

      <div className="badge-row">
        <span className="info-badge">PES {pesStatus}</span>
        <span className="info-badge">{plan.pesLabel.split('—')[0].trim()}</span>
        <span className="info-badge">{goal} target</span>
      </div>

      <div className="prep-week-grid">
        {plan.weeklyPlan.map((day) => (
          <article key={day.day} className="prep-day-card">
            <div className="prep-day-header">
              <div>
                <div className="prep-day-name">{day.day}</div>
                <div className="prep-day-focus">{day.focus}</div>
              </div>
            </div>
            <div className="prep-exercise-list">
              {day.exercises.map((ex, index) => (
                <div key={index} className="prep-exercise-row">
                  <div className="prep-exercise-info">
                    <span className="prep-exercise-name">{ex.name}</span>
                    <span className="prep-exercise-detail">{formatExercise(ex)}</span>
                  </div>
                  <span
                    className={`prep-component-badge component-${ex.component}`}
                  >
                    {COMPONENT_LABELS[ex.component] || ex.component}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="prep-note-card">
        <p className="kicker">Note</p>
        <p>
          This plan is calibrated to your PES status. Always follow your doctor's or Medical
          Officer's guidance if you have medical restrictions. PES C and E recruits should adjust
          intensity accordingly.
        </p>
      </div>
    </section>
  );
}
