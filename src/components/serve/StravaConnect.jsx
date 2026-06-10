import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Panel from '../ui/Panel';
import stravaService from '../../services/stravaService';

const STRAVA_ORANGE = '#FC4C02';

// Official Strava chevron mark, kept orange and contained to Strava-only UI.
function StravaMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={STRAVA_ORANGE} aria-label="Strava" role="img">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

function CheckCircle({ size = 56 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: 'rgba(74,92,63,0.18)', border: '1px solid var(--success)', color: 'var(--success)',
        fontSize: size * 0.5, fontWeight: 800,
      }}
    >
      ✓
    </div>
  );
}

// Single component drives all three routes via the path:
//   /serve/strava-connect   — entry / manage connection
//   /serve/strava-connected — post-OAuth landing, auto-syncs runs
//   /serve/strava-error     — OAuth failure
export default function StravaConnect({ state, setStravaData, clearStravaData }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname.endsWith('/strava-connected')) {
    return <ConnectedLanding state={state} setStravaData={setStravaData} navigate={navigate} />;
  }
  if (pathname.endsWith('/strava-error')) {
    return <ErrorView navigate={navigate} />;
  }
  return <ConnectView state={state} setStravaData={setStravaData} clearStravaData={clearStravaData} navigate={navigate} />;
}

function Shell({ navigate, children }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <button className="wk-back" onClick={() => navigate('/serve')} aria-label="Back to Serve" style={{ marginBottom: 20 }}>‹</button>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>
    </div>
  );
}

function ConnectView({ state, setStravaData, clearStravaData, navigate }) {
  const [serverStatus, setServerStatus] = useState({ connected: false, athlete: null });
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Reflect the server's live connection state on mount.
  useEffect(() => {
    let active = true;
    stravaService.getStatus().then((status) => {
      if (active) setServerStatus(status);
    });
    return () => { active = false; };
  }, []);

  const connected = state.strava?.connected || serverStatus.connected;
  const athlete = state.strava?.athlete || serverStatus.athlete;

  const handleConnect = async () => {
    setLoadingAuth(true);
    const url = await stravaService.getAuthUrl();
    if (url) {
      window.location.href = url; // same-tab redirect — popups get blocked
    } else {
      setLoadingAuth(false);
      navigate('/serve/strava-error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    const { activities, swims, athlete: a, error } = await stravaService.getActivities();
    setSyncing(false);
    if (error === 'not_connected') {
      clearStravaData?.();
      setServerStatus({ connected: false, athlete: null });
      setSyncMsg('Connection lost. Please reconnect.');
      return;
    }
    if (error) {
      setSyncMsg('Could not reach Strava. Try again in a moment.');
      return;
    }
    setStravaData(activities, a || athlete, swims);
    const parts = [];
    parts.push(`${activities.length} ${activities.length === 1 ? 'run' : 'runs'}`);
    if (swims.length) parts.push(`${swims.length} ${swims.length === 1 ? 'swim' : 'swims'}`);
    setSyncMsg(`${parts.join(' · ')} synced.`);
  };

  const handleDisconnect = () => {
    clearStravaData?.();
    setServerStatus({ connected: false, athlete: null });
    setSyncMsg('');
  };

  return (
    <Shell navigate={navigate}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          {connected ? <CheckCircle /> : <StravaMark />}
        </div>
        <h1 className="h-display" style={{ fontSize: 38, marginBottom: 10 }}>CONNECT STRAVA</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.55 }}>
          Sync your runs automatically. Your 2.4km times update your IPPT tracker.
        </p>
      </div>

      <Panel ticks style={{ padding: 28 }}>
        {connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--success)', fontSize: 18 }}>✓</span>
              <span className="mono" style={{ fontSize: 14 }}>
                Connected as {athlete ? `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() : 'your Strava account'}
              </span>
            </div>
            {syncMsg && <p className="mono-dim" style={{ fontSize: 12, margin: 0 }}>{syncMsg}</p>}
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                className="btn full"
                style={{ flex: 1, background: STRAVA_ORANGE, borderColor: STRAVA_ORANGE }}
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? 'SYNCING…' : 'SYNC NOW'}
              </button>
              <button className="btn neutral" onClick={handleDisconnect} disabled={syncing}>DISCONNECT</button>
            </div>
            <button
              className="btn ghost sm full"
              onClick={() => navigate('/training-feed')}
            >
              GO TO TRAINING FEED →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <p className="mono-dim" style={{ fontSize: 12.5, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              You'll be sent to Strava to authorise read access to your activities. We only ever read runs.
            </p>
            <button
              className="btn full lg"
              style={{ background: STRAVA_ORANGE, borderColor: STRAVA_ORANGE }}
              onClick={handleConnect}
              disabled={loadingAuth}
            >
              {loadingAuth ? 'REDIRECTING…' : 'CONNECT WITH STRAVA'}
            </button>
          </div>
        )}
      </Panel>
    </Shell>
  );
}

function ConnectedLanding({ state, setStravaData, navigate }) {
  const [status, setStatus] = useState('syncing'); // 'syncing' | 'done' | 'error'
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    stravaService.getActivities().then(({ activities, swims, athlete, error }) => {
      if (!active) return;
      if (error) {
        setStatus('error');
        return;
      }
      setStravaData(activities, athlete, swims);
      setCount(activities.length + swims.length);
      setStatus('done');
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const athlete = state.strava?.athlete;

  return (
    <Shell navigate={navigate}>
      <div style={{ textAlign: 'center', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          {status === 'error' ? <StravaMark /> : <CheckCircle />}
        </div>

        {status === 'syncing' && (
          <>
            <h1 className="h-display" style={{ fontSize: 34, marginBottom: 10 }}>STRAVA CONNECTED!</h1>
            <p className="mono-dim" style={{ fontSize: 13 }}><span className="blink">●</span> Syncing your runs…</p>
          </>
        )}

        {status === 'done' && (
          <>
            <h1 className="h-display" style={{ fontSize: 34, marginBottom: 10 }}>STRAVA CONNECTED!</h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: 6 }}>
              {athlete ? `Welcome, ${athlete.firstname}. ` : ''}
              <strong style={{ color: STRAVA_ORANGE }}>{count} {count === 1 ? 'activity' : 'activities'}</strong> synced.
            </p>
            <button
              className="btn lg"
              style={{ marginTop: 18, background: STRAVA_ORANGE, borderColor: STRAVA_ORANGE }}
              onClick={() => navigate('/training-feed')}
            >
              GO TO TRAINING FEED →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="h-display" style={{ fontSize: 30, marginBottom: 10 }}>SYNC FAILED</h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: 18 }}>
              We connected to Strava but couldn't pull your runs. You can retry from the connect screen.
            </p>
            <button className="btn" onClick={() => navigate('/serve/strava-connect')}>BACK TO CONNECT</button>
          </>
        )}
      </div>
    </Shell>
  );
}

function ErrorView({ navigate }) {
  return (
    <Shell navigate={navigate}>
      <div style={{ textAlign: 'center', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <StravaMark />
        </div>
        <h1 className="h-display" style={{ fontSize: 32, marginBottom: 10 }}>SOMETHING WENT WRONG</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>
          Something went wrong connecting Strava.
        </p>
        <button
          className="btn lg"
          style={{ background: STRAVA_ORANGE, borderColor: STRAVA_ORANGE }}
          onClick={() => navigate('/serve/strava-connect')}
        >
          TRY AGAIN
        </button>
      </div>
    </Shell>
  );
}
