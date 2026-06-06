import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ProfileRow, ScreenHeader } from './shared/AppScreenPrimitives';
import { addYears, daysBetween, getToday, toTitleCase } from './shared/appScreenUtils';

export default function ProfilePage({ state, phase, activeModule, onResetAppState }) {
  const { ipptGoal } = useAppContext();
  const profile = state.auth.profile;
  const navigate = useNavigate();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);

  const signOut = () => {
    onResetAppState?.();
    navigate('/login');
  };

  return (
    <section>
      <ScreenHeader title="Profile" subtitle="Singpass and MINDEF-sourced service profile." />
      <div className="profile-layout">
        <div className="profile-card profile-hero-card">
          <p className="kicker">Service profile</p>
          <h2>{toTitleCase(profile.fullName)}</h2>
          <p className="profile-hero-meta">
            PES {profile.pesStatus}
            {profile.unit ? ` · ${profile.unit}` : ''}
          </p>
          <div className="profile-stat-row">
            <div className="profile-stat">
              <span>Current phase</span>
              <strong>{phase === 'enlist' ? 'Enlist' : 'Serve'}</strong>
            </div>
            <div className="profile-stat">
              <span>Module view</span>
              <strong>{activeModule === 'enlist' ? 'Enlist' : 'Serve'}</strong>
            </div>
            <div className="profile-stat">
              <span>Days to ORD</span>
              <strong>{ordDays}</strong>
            </div>
          </div>
        </div>
        <div className="profile-card">
          <ProfileRow label="Full name" value={toTitleCase(profile.fullName)} />
          <ProfileRow label="NRIC" value={profile.nric} />
          <ProfileRow label="Enlistment date" value={profile.enlistmentDate} />
          <ProfileRow label="PES status" value={profile.pesStatus} />
          <ProfileRow label="Unit" value={profile.unit || 'Pending assignment'} />
          <ProfileRow label="IPPT goal" value={ipptGoal || state.onboarding.ipptGoal} />
        </div>
      </div>
      <button className="secondary-button" onClick={signOut}>
        Sign out
      </button>
    </section>
  );
}
