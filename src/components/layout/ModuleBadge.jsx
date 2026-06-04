export default function ModuleBadge({ module }) {
  return <div className="module-badge">{module === 'serve' ? 'SERVE' : 'ENLIST'}</div>;
}
