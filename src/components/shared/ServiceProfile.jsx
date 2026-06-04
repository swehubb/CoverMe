export default function ServiceProfile({ user }) {
  return (
    <section className="card shared-service-profile">
      <div className="section-label">Service Profile</div>
      <div className="shared-service-summary">
        <strong>
          PES {user.pes} · {user.unit}
        </strong>
      </div>
      <div className="profile-grid">
        <div className="profile-line">
          <span className="muted-text">NSF</span>
          <span>{user.name}</span>
        </div>
        <div className="profile-line">
          <span className="muted-text">NRIC</span>
          <span>{user.nric}</span>
        </div>
        <div className="profile-line">
          <span className="muted-text">Rank</span>
          <span>{user.rank}</span>
        </div>
      </div>
    </section>
  );
}
