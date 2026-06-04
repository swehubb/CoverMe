import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const GOAL_OPTIONS = [
  {
    label: 'Pass',
    points: '51–60 points',
    description: 'Build a stable baseline and clear the standard with confidence.',
  },
  {
    label: 'Pass with Incentive',
    points: '61–74 points',
    description: 'Push beyond the baseline and train for stronger payouts and consistency.',
  },
  {
    label: 'Silver',
    points: '75–84 points',
    description: 'Train above the baseline with stronger endurance and sharper event pacing.',
  },
  {
    label: 'Gold',
    points: '85+ points',
    description: 'Train for top-tier output across strength, endurance, and pace.',
  },
];

export default function GoalSetupPage({ state, updateState }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(state.onboarding.ipptGoal);

  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (state.onboarding.ipptGoal && state.onboarding.consented) {
    return <Navigate to="/home" replace />;
  }

  const saveGoal = () => {
    if (!selected) return;
    updateState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        ipptGoal: selected,
      },
    }));
    navigate('/setup/consent');
  };

  const profile = state.auth.profile;

  return (
    <section className="setup-screen">
      <header className="screen-header">
        <p className="kicker">Profile setup · Step 1 of 2</p>
        <h1>What's your IPPT goal?</h1>
        {profile && (
          <p>
            PES {profile.pesStatus} · {profile.unit}
          </p>
        )}
        <div className="rule" />
      </header>
      <div className="card-stack">
        {GOAL_OPTIONS.map((option) => (
          <button
            key={option.label}
            className={`selection-card${selected === option.label ? ' selected' : ''}`}
            onClick={() => setSelected(option.label)}
            type="button"
          >
            <div>
              <div className="selection-title">{option.label}</div>
              <div className="selection-subtitle">{option.points}</div>
            </div>
            <p>{option.description}</p>
          </button>
        ))}
      </div>
      <button className="primary-button" onClick={saveGoal} disabled={!selected}>
        Let's go.
      </button>
    </section>
  );
}
