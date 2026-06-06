import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Insignia from '../shared/Insignia';

const NAV_ITEMS = [
  { to: '/serve', label: 'OPS', glyph: '▣', routes: ['/serve', '/enlist'], module: 'serve' },
  { to: '/train', label: 'IPPT', glyph: '▲', routes: ['/train', '/fitness-prep', '/weekend-planner'], module: 'serve' },
  { to: '/journal', label: 'MIND', glyph: '◈', routes: ['/journal', '/escalation', '/ai-chat'], module: 'serve' },
  { to: '/buddy-tap', label: 'SQUAD', glyph: '⛨', routes: ['/buddy-tap', '/peer-support', '/peer-intel', '/community'], module: 'serve' },
  { to: '/profile', label: 'RECORD', glyph: '◮', routes: ['/profile', '/what-to-expect'] },
];

const ROUTE_TITLES = {
  '/enlist': 'ENLIST / OPERATIONS',
  '/serve': 'SERVE / OPERATIONS',
  '/fitness-prep': 'ENLIST / FITNESS PREP',
  '/what-to-expect': 'ENLIST / FIELD GUIDE',
  '/ai-chat': 'ENLIST / VERIFIED INTEL',
  '/peer-intel': 'ENLIST / PEER INTEL',
  '/train': 'SERVE / IPPT TRACKER',
  '/weekend-planner': 'SERVE / WEEKEND PLAN',
  '/journal': 'SERVE / SENTINEL',
  '/escalation': 'SERVE / SUPPORT OPTIONS',
  '/buddy-tap': 'SERVE / BUDDY TAP',
  '/peer-support': 'SERVE / PEER WALL',
  '/community': 'SERVE / SQUAD SUPPORT',
  '/profile': 'SERVE / SERVICE RECORD',
};

export default function Navbar({ profile, onModuleChange, onSignOut }) {
  const location = useLocation();
  const { currentModule, setCurrentModule } = useAuth();
  const activeModule =
    location.pathname === '/serve'
      ? 'serve'
      : location.pathname === '/enlist'
        ? 'enlist'
        : currentModule || 'enlist';

  const title = ROUTE_TITLES[location.pathname] || 'COVER ME / COMMAND TERMINAL';
  const shortName = profile?.fullName?.split(' ').slice(-1)[0] || 'USER';

  return (
    <>
      <aside className="command-rail">
        <NavLink to={`/${activeModule}`} className="rail-brand" aria-label="Cover Me home">
          <Insignia size={30} />
          <span>CM</span>
        </NavLink>
        <nav className="rail-nav" aria-label="Primary command navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.routes.some((route) => location.pathname.startsWith(route));
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`rail-link${isActive ? ' active' : ''}`}
                title={item.label}
                onClick={() => item.module && onModuleChange(item.module)}
              >
                <span className="rail-status" />
                <span className="rail-glyph">{item.glyph}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button className="rail-signout" type="button" onClick={onSignOut} title="Sign out">
          ⏻
        </button>
      </aside>

      <header className="nav-shell">
        <div className="nav-inner">
          <div className="nav-route">
            <span className="nav-route-mark">◢</span>
            <strong>{title}</strong>
            <span className="nav-branch-badge">LAND FORCE</span>
          </div>
          <nav className="nav-actions" aria-label="Module and profile navigation">
            <div className="module-toggle nav-module-toggle" role="tablist" aria-label="Module switch">
              <NavLink
                to="/enlist"
                className={`nav-module-link${activeModule === 'enlist' ? ' active' : ''}`}
                onClick={() => {
                  setCurrentModule('enlist');
                  onModuleChange('enlist');
                }}
              >
                Enlist
              </NavLink>
              <NavLink
                to="/serve"
                className={`nav-module-link${activeModule === 'serve' ? ' active' : ''}`}
                onClick={() => {
                  setCurrentModule('serve');
                  onModuleChange('serve');
                }}
              >
                Serve
              </NavLink>
              <div className={`module-toggle-thumb ${activeModule}`} />
            </div>
            <NavLink to="/profile" className="nav-user">
              <span className="nav-user-insignia"><Insignia size={17} /></span>
              <span>
                <strong>{shortName}</strong>
                <small>PES {profile?.pesStatus || 'B1'}</small>
              </span>
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  );
}
