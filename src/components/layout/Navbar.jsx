import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { currentModule, setCurrentModule } = useAuth();
  const { activeModule, setActiveModule } = useAppContext();
  const resolvedActiveModule =
    location.pathname === '/serve'
      ? 'serve'
      : location.pathname === '/enlist'
        ? 'enlist'
        : activeModule || currentModule || 'enlist';

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div className="nav-brand">
          <div className="nav-logo">Cover Me</div>
          <div className="nav-tagline">One service journey. Two modules.</div>
        </div>
        <nav className="nav-actions" aria-label="Primary">
          <div className="module-toggle nav-module-toggle" role="tablist" aria-label="Module switch">
            <NavLink
              to="/enlist"
              className={`nav-module-link${resolvedActiveModule === 'enlist' ? ' active' : ''}`}
              onClick={() => {
                setActiveModule('enlist');
                setCurrentModule('enlist');
              }}
            >
              Enlist
            </NavLink>
            <NavLink
              to="/serve"
              className={`nav-module-link${resolvedActiveModule === 'serve' ? ' active' : ''}`}
              onClick={() => {
                setActiveModule('serve');
                setCurrentModule('serve');
              }}
            >
              Serve
            </NavLink>
            <div className={`module-toggle-thumb ${resolvedActiveModule}`} />
          </div>
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Profile
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
