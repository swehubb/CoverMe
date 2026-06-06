export default function Award({ award }) {
  if (!award || award === 'FAIL' || award === 'Below Pass') {
    return <span className="badge" style={{ background: 'var(--danger)', color: '#fff' }}>FAIL</span>;
  }
  const map = {
    GOLD: 'gold', Gold: 'gold',
    SILVER: 'silver', Silver: 'silver',
    'PASS': 'pass', 'Pass': 'pass',
    'Pass with Incentive': 'pass',
    'PASS with Incentive': 'pass',
  };
  const cls = map[award] || 'pass';
  return <span className={`badge ${cls}`}>{award.toUpperCase()}</span>;
}
