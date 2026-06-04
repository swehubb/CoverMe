import PageWrapper from '../components/layout/PageWrapper';
import ServiceProfile from '../components/shared/ServiceProfile';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, currentModule } = useAuth();

  return (
    <PageWrapper
      title="Profile"
      description="Mock Singpass user data from AuthContext, available across the app through useAuth()."
      module={currentModule}
    >
      <div className="grid-2">
        <ServiceProfile user={user} />
        <section className="card">
          <div className="section-label">Service Dates</div>
          <div className="profile-grid">
            <div className="profile-line">
              <span className="muted-text">Enlistment Date</span>
              <strong>{user.enlistmentDate}</strong>
            </div>
            <div className="profile-line">
              <span className="muted-text">ORD Date</span>
              <strong>{user.ordDate}</strong>
            </div>
            <div className="profile-line">
              <span className="muted-text">Role</span>
              <strong>{user.role}</strong>
            </div>
            <div className="profile-line">
              <span className="muted-text">Current Module</span>
              <strong>{currentModule}</strong>
            </div>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
