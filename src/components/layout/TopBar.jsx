import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Insignia from '../shared/Insignia';

const ROUTE_TITLES = {
  '/login':          'AUTHENTICATION',
  '/setup/goal':     'ONBOARD / IPPT OBJECTIVE',
  '/setup/consent':  'ONBOARD / WELLNESS CONSENT',
  '/enlist':         'ENLIST / OPERATIONS',
  '/serve':          'SERVE / OPERATIONS',
  '/train':          'SERVE / IPPT TRACKER',
  '/journal':        'SERVE / SENTINEL',
  '/buddy-tap':      'SERVE / SQUAD SUPPORT',
  '/peer-support':   'SERVE / PEER WALL',
  '/escalation':     'SERVE / ESCALATION',
  '/profile':        'SERVE / SERVICE RECORD',
  '/what-to-expect': 'ENLIST / BRIEF',
  '/fitness-prep':   'ENLIST / FITNESS PREP',
  '/ai-chat':        'ENLIST / ASK ANYTHING',
  '/peer-intel':     'ENLIST / PEER INTEL',
  '/weekend-planner':'SERVE / WEEKEND PLAN',
};

function LiveReadout() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="live-readout">
      <span>
        {time.toLocaleTimeString('en-GB', { hour12: false })}
        <span className="blink"> ●</span> LIVE
      </span>
    </div>
  );
}

export default function TopBar({ branch, activeModule, onModuleChange, profile }) {
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] || 'SERVE';

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-bullet">▲</span>
        <span className="top-bar-title">{title}</span>
        <span className="badge verified" style={{ fontSize: 10 }}>
          {branch === 'army' ? 'LAND FORCE' :
           branch === 'navy' ? 'SEA FORCE'  :
           branch === 'air'  ? 'AIR FORCE'  : 'DIGITAL FORCE'}
        </span>
      </div>
      <div className="top-bar-right">
        {onModuleChange && (
          <div className="top-module-switch" role="tablist" aria-label="Journey mode">
            {[
              ['enlist', 'Enlist'],
              ['serve', 'Serve'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeModule === key ? 'active' : ''}
                onClick={() => onModuleChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <LiveReadout />
        {profile && (
          <div className="topbar-profile">
            <div className="topbar-avatar">
              <Insignia branch={branch} size={16} />
            </div>
            <div className="topbar-name">
              <div className="topbar-name-main">
                {profile.fullName.split(' ').slice(-2).join(' ')}
              </div>
              <div className="topbar-name-sub">{profile.pesStatus}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
