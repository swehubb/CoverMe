import { ScreenHeader } from './shared/AppScreenPrimitives';
import { useAppContext } from '../contexts/AppContext';
import { getWeekendPlanner } from './shared/appScreenUtils';

export default function WeekendPlannerPage({ state, activeModule }) {
  const { ipptGoal, ipptLogs } = useAppContext();
  const profile = state.auth.profile;
  const resolvedGoal = ipptGoal || state.onboarding.ipptGoal;
  const weekendPlanner = getWeekendPlanner(profile, resolvedGoal, ipptLogs);

  return (
    <section>
      <ScreenHeader
        title="Weekend IPPT Planner"
        subtitle={
          activeModule === 'serve'
            ? 'A dedicated two-day workout block based on your current IPPT band and service vocation.'
            : 'A dedicated two-day workout block based on your current IPPT band and target.'
        }
      />
      <div className="badge-row">
        <span className="info-badge">PES {profile.pesStatus}</span>
        <span className="info-badge">{profile.vocation}</span>
        <span className="info-badge">{resolvedGoal}</span>
      </div>
      <div className="weekend-planner-card static">
        <div className="weekend-planner-topline">
          <div>
            <p className="kicker">This Weekend</p>
            <h3>IPPT/Vocation-Based Weekend Plan</h3>
          </div>
          <span className="info-badge">{profile.vocation}</span>
        </div>
        <p className="weekend-planner-summary">{weekendPlanner.summary}</p>
        <div className="horizontal-days weekend-days">
          {weekendPlanner.days.map((day) => (
            <article key={day.id} className="day-card">
              <div className="day-card-header">
                <span>{day.label}</span>
                <strong>{day.duration}</strong>
              </div>
              <p>{day.workout}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
