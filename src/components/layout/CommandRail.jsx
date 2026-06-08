import { useNavigate, useLocation } from 'react-router-dom';
import Insignia from '../shared/Insignia';

const SERVE_NAV = [
  { id: 'ops',      label: 'OPS',    glyph: '⊞', path: '/serve' },
  { id: 'ippt',     label: 'IPPT',   glyph: '▲', path: '/train' },
  { id: 'sentinel', label: 'MIND',   glyph: '◈', path: '/journal' },
  { id: 'support',  label: 'SQUAD',  glyph: '⊕', path: '/buddy-tap' },
  { id: 'profile',  label: 'RECORD', glyph: '◮', path: '/profile' },
];

const ENLIST_NAV = [
  { id: 'enlist',  label: 'OPS',    glyph: '⊞', path: '/enlist' },
  { id: 'expect',  label: 'BRIEF',  glyph: '▤', path: '/what-to-expect' },
  { id: 'fitness', label: 'TRAIN',  glyph: '▲', path: '/fitness-prep' },
  { id: 'chat',    label: 'ASK',    glyph: '◈', path: '/ai-chat' },
  { id: 'intel',   label: 'INTEL',  glyph: '⊕', path: '/peer-intel' },
  { id: 'profile', label: 'RECORD', glyph: '◮', path: '/profile' },
];

export default function CommandRail({ branch = 'army', activeModule = 'serve', onSignOut, onModuleChange }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const nav = activeModule === 'enlist' ? ENLIST_NAV : SERVE_NAV;

  const isActive = (path) => {
    if (path === '/serve' || path === '/enlist') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div className="cmd-rail">
      <div style={{ color: 'var(--accent-text)', marginBottom: 4 }}>
        <Insignia branch={branch} size={30} />
      </div>
      <div className="cmd-rail-logo">CM</div>

      <nav className="cmd-nav">
        {nav.map((item) => (
          <button
            key={item.id}
            className={`cmd-nav-btn${isActive(item.path) ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <span className="cmd-nav-dot" />
            <span className="cmd-nav-glyph">{item.glyph}</span>
            <span className="cmd-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="cmd-signout" onClick={onSignOut} title="Sign out">
        ⏻
      </button>
    </div>
  );
}
