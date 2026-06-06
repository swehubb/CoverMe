export default function FeatureCard({ title, description, onClick, eyebrow = 'Feature' }) {
  const glyph =
    title.includes('IPPT') || title.includes('Fitness')
      ? '▲'
      : title.includes('Sentinel') || title.includes('Journal') || title.includes('AI')
        ? '◈'
        : title.includes('Buddy') || title.includes('Support')
          ? '⛨'
          : title.includes('Intel') || title.includes('Wall')
            ? '⬡'
            : '▣';

  return (
    <button type="button" className="feature-card shared-feature-card" onClick={onClick}>
      <div className="shared-feature-topline">
        <span className="shared-feature-glyph">{glyph}</span>
        <span className="section-label">{eyebrow}</span>
      </div>
      <div className="shared-feature-body">
        <h3 className="feature-card-title">{title}</h3>
        <p className="card-copy">{description}</p>
      </div>
      <div className="shared-feature-footer" aria-hidden="true">
        <span className="shared-feature-arrow">Enter module →</span>
      </div>
    </button>
  );
}
