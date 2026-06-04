export default function FeatureCard({ title, description, onClick, eyebrow = 'Feature' }) {
  return (
    <button type="button" className="feature-card shared-feature-card" onClick={onClick}>
      <div className="section-label">{eyebrow}</div>
      <div className="shared-feature-body">
        <h3 className="feature-card-title">{title}</h3>
        <p className="card-copy">{description}</p>
      </div>
      <div className="shared-feature-footer" aria-hidden="true">
        <span className="shared-feature-arrow">Open</span>
      </div>
    </button>
  );
}
