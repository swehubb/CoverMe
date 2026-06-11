import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CommandRail from './components/layout/CommandRail';
import TopBar from './components/layout/TopBar';
import Panel from './components/ui/Panel';
import Stat from './components/ui/Stat';
import Award from './components/ui/Award';
import SvgLineChart from './components/ui/SvgLineChart';
import Insignia from './components/shared/Insignia';
import { peerIntelPosts } from './data/mockPeerIntel';
import { peerWallPosts, wallPhases } from './data/mockPeerWall';
import { platoonMembers, peerSupportLead } from './data/mockPlatoon';
import { demoIpptAttemptsByAccount } from './data/mockAccounts';
import nlpService from './services/nlpService';
import stravaService from './services/stravaService';
import * as dbService from './services/dbService';
import { notify, crisisResources } from './services/mockNotification';
import {
  buildTrainingPlan,
  trainingActivity,
  wellnessPrompts,
} from './data';
import LandingPage from './pages/LandingPage';
import GoalSetupPage from './pages/GoalSetupPage';
import ConsentPage from './pages/ConsentPage';
import EnlistDashboardPage from './pages/EnlistDashboardPage';
import WhatToExpectPage from './pages/WhatToExpectPage';
import FitnessPrepPage from './pages/FitnessPrepPage';
import PreEnlistmentWorkout from './pages/PreEnlistmentWorkout';
import WorkoutSession from './pages/WorkoutSession';
import AiChatPage from './pages/AiChatPage';
import PeerIntelPage from './pages/PeerIntelPage';
import StravaConnect from './components/serve/StravaConnect';
import armyOperator from './assets/operators/army-operator.png';
import navyOperator from './assets/operators/navy-operator.png';
import airforceOperator from './assets/operators/airforce-operator.png';
import disOperator from './assets/operators/dis-operator.png';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const STORAGE_KEY = 'cover-me-state';
const OPERATOR_BY_BRANCH = {
  army: armyOperator,
  land: armyOperator,
  'land force': armyOperator,
  navy: navyOperator,
  air: airforceOperator,
  airforce: airforceOperator,
  'air force': airforceOperator,
  rsaf: airforceOperator,
  dis: disOperator,
  digital: disOperator,
  'digital force': disOperator,
  'digital and intelligence service': disOperator,
};

// Bump this whenever the seeded mock data below (journal, intel/wall posts, IPPT,
// training feed, etc.) changes. On load, a saved copy with an older version is
// dropped so the new seeds appear instead of being overridden by the stale cache.
const SEED_VERSION = 6;

const defaultState = {
  __seedVersion: SEED_VERSION,
  auth: {
    isAuthenticated: false,
    profile: null,
  },
  onboarding: {
    ipptGoal: '',
    consented: false,
  },
  settings: {
    sentinelEnabled: true,
    eveningReminder: true,
  },
  ippt: {
    attempts: demoIpptAttemptsByAccount['recruit-tan'],
    attemptsByAccount: demoIpptAttemptsByAccount,
  },
  swim: {
    attempts: [],
  },
  workoutPlan: {
    cacheKey: null,
    plan: null,
  },
  journal: {
    entries: [
      seedEntry('2026-05-07', 'How are you ending today?', 'Tired but steady.', 0.71),
      seedEntry('2026-05-08', 'How are you ending today?', 'A bit flat after training.', 0.64),
      seedEntry('2026-05-09', 'How are you ending today?', 'Managed the day well.', 0.7),
      seedEntry('2026-05-10', 'How are you ending today?', 'Energy was lower today.', 0.61),
      seedEntry('2026-05-11', 'How are you ending today?', 'Felt stretched thin.', 0.58),
      seedEntry('2026-05-12', 'How are you ending today?', 'Still okay, just worn out.', 0.55),
      seedEntry('2026-05-13', 'How are you ending today?', 'Harder to switch off tonight.', 0.5),
      seedEntry('2026-05-14', 'How are you ending today?', 'A little better after talking.', 0.57),
      seedEntry('2026-05-15', 'How are you ending today?', 'Steadier day overall.', 0.62),
      seedEntry('2026-05-16', 'How are you ending today?', 'Routine helped.', 0.66),
      seedEntry('2026-05-17', 'How are you ending today?', 'Good pace today.', 0.69),
      seedEntry('2026-05-18', 'How are you ending today?', 'Mentally clearer.', 0.72),
      seedEntry('2026-05-19', 'How are you ending today?', 'Not perfect, but stable.', 0.74),
    ],
  },
  community: {
    intelPosts: peerIntelPosts,
    wallPosts: peerWallPosts,
    concerns: [],
    buddyTaps: [
      { id: 'tap-seed-1', toUserId: 'platoon-02', fromUserId: 'platoon-01', text: '', timestamp: '2026-05-18T20:30:00.000Z' },
      { id: 'tap-seed-2', toUserId: 'platoon-02', fromUserId: 'platoon-04', text: '', timestamp: '2026-05-18T20:32:00.000Z' },
      { id: 'tap-seed-3', toUserId: 'platoon-02', fromUserId: 'platoon-05', text: '', timestamp: '2026-05-18T20:35:00.000Z' },
    ],
  },
  support: {
    pslThreads: [
      {
        id: 'psl-001',
        alias: 'Anonymous Recruit 04',
        subject: 'Adjusting to section tempo',
        status: 'open',
        createdAt: '2026-05-18T21:14:00.000Z',
        assignedTo: 'Amirul Hassan',
        requesterId: 'platoon-02',
        messages: [
          { from: 'anonymous', text: 'I have not been coping well lately. I want to talk, but I do not want my name attached to this.', timestamp: '2026-05-18T21:14:00.000Z' },
          { from: 'psl', text: 'Thanks for reaching out. We can keep this anonymous and take it one step at a time. What has been weighing on you the most?', timestamp: '2026-05-18T21:22:00.000Z' },
        ],
      },
    ],
    outreachPrompts: [
      {
        id: 'outreach-marcus-seed',
        userId: 'platoon-02',
        status: 'pending',
        createdAt: '2026-05-18T20:40:00.000Z',
        reason: 'A few people in your unit noticed you may be having a rough week.',
      },
    ],
    okayNotifications: [],
  },
  social: {
    trainingFeed: trainingActivity,
    trainingFeedPosts: trainingActivity,
  },
  workout: {
    logs: [],
    intake: null,
    plan: null,
  },
  strava: {
    connected: false,
    athlete: null, // { firstname, lastname }
    activities: [], // synced run activities
    swims: [], // synced swim activities
    lastSynced: null, // ISO timestamp of last successful sync
  },
  ui: {
    activeModule: '',
    branch: 'army',
  },
};

function normalizeProfile(profile) {
  if (!profile) return null;

  const rawName = profile.fullName || profile.name;
  const fullName = !rawName || ['WEI', 'TAN AN WEI'].includes(rawName.toUpperCase()) ? 'Zach Poh' : rawName;
  const pesStatus = profile.pesStatus || profile.pes || 'B1';

  return {
    ...profile,
    fullName,
    name: fullName,
    pesStatus,
    vocation: profile.vocation || (profile.unit?.includes('SIR') ? 'Infantry' : 'General'),
    unit: profile.unit || '3 SIR',
    enlistmentDate: profile.enlistmentDate || '2026-05-01',
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;

  try {
    const parsed = JSON.parse(saved);
    if (parsed?.auth?.profile) {
      parsed.auth.profile = normalizeProfile(parsed.auth.profile);
      if (parsed.auth.profile.id === 'commander-marcus') {
        parsed.auth.profile = normalizeProfile({
          ...parsed.auth.profile,
          id: 'nsf-marcus',
          memberId: 'platoon-02',
          role: 'nsf',
          rank: 'REC',
          pes: 'B1',
          pesStatus: 'B1',
          enlistmentDate: '2026-05-01',
          ordDate: '2028-03-01',
          ipptGoal: 'Pass',
          consented: true,
          currentModule: 'serve',
        });
      }
      if (parsed.auth.profile.id === 'psl-jonathan') {
        parsed.auth.profile = normalizeProfile({
          ...parsed.auth.profile,
          id: 'psl-amirul',
          memberId: 'platoon-03',
          name: 'Amirul Hassan',
          fullName: 'Amirul Hassan',
          role: 'peer-support',
          rank: '3SG',
        });
      }
    }
    if (parsed?.support?.pslThreads) {
      parsed.support.pslThreads = parsed.support.pslThreads.map((thread) => ({
        ...thread,
        assignedTo: thread.assignedTo === 'Jonathan Tay' ? 'Amirul Hassan' : thread.assignedTo,
        requesterId: thread.requesterId || (thread.alias?.includes('Recruit') ? 'platoon-02' : undefined),
        messages: thread.id === 'psl-001'
          ? [
              { from: 'anonymous', text: 'I have not been coping well lately. I want to talk, but I do not want my name attached to this.', timestamp: '2026-05-18T21:14:00.000Z' },
              { from: 'psl', text: 'Thanks for reaching out. We can keep this anonymous and take it one step at a time. What has been weighing on you the most?', timestamp: '2026-05-18T21:22:00.000Z' },
            ]
          : thread.messages,
      }));
    }
    if (parsed?.support && !parsed.support.outreachPrompts) {
      parsed.support.outreachPrompts = defaultState.support.outreachPrompts;
    }
    if (parsed?.support && !parsed.support.okayNotifications) {
      parsed.support.okayNotifications = [];
    }
    if (parsed?.community && !parsed.community.buddyTaps?.some(t => t.fromUserId)) {
      parsed.community.buddyTaps = defaultState.community.buddyTaps;
    }
    if (
      parsed?.auth?.profile?.enlistmentDate === '2026-09-14' ||
      parsed?.auth?.profile?.enlistmentDate === '2026-02-15' ||
      parsed?.auth?.profile?.enlistmentDate === '2026-03-26'
    ) {
      parsed.auth.profile.enlistmentDate = '2026-03-25';
    }
    if (parsed?.auth?.profile && !parsed.auth.profile.vocation) {
      parsed.auth.profile.vocation =
        parsed.auth.profile.unit?.includes('SIR') ? 'Infantry' : 'General';
    }
    if (parsed.__seedVersion !== SEED_VERSION) {
      // Seed data changed in code: start from the fresh seeds, but keep the user
      // signed in and their onboarding choices so they don't get logged out.
      return {
        ...defaultState,
        auth: { ...defaultState.auth, ...parsed.auth },
        onboarding: { ...defaultState.onboarding, ...parsed.onboarding },
        settings: { ...defaultState.settings, ...parsed.settings },
        ippt: {
          ...defaultState.ippt,
          ...parsed.ippt,
          attemptsByAccount: { ...defaultState.ippt.attemptsByAccount, ...parsed.ippt?.attemptsByAccount },
        },
        support: { ...defaultState.support, ...parsed.support },
        swim: { ...defaultState.swim, ...parsed.swim },
        workoutPlan: { ...defaultState.workoutPlan, ...parsed.workoutPlan },
      };
    }
    return {
      ...defaultState,
      ...parsed,
      auth: { ...defaultState.auth, ...parsed.auth },
      onboarding: { ...defaultState.onboarding, ...parsed.onboarding },
      settings: { ...defaultState.settings, ...parsed.settings },
      ippt: {
        ...defaultState.ippt,
        ...parsed.ippt,
        attemptsByAccount: { ...defaultState.ippt.attemptsByAccount, ...parsed.ippt?.attemptsByAccount },
      },
      swim: { ...defaultState.swim, ...parsed.swim },
      workoutPlan: { ...defaultState.workoutPlan, ...parsed.workoutPlan },
      journal: { ...defaultState.journal, ...parsed.journal },
      community: { ...defaultState.community, ...parsed.community },
      support: { ...defaultState.support, ...parsed.support },
      social: { ...defaultState.social, ...parsed.social },
      workout: { ...defaultState.workout, ...parsed.workout },
      strava: { ...defaultState.strava, ...parsed.strava },
      ui: { ...defaultState.ui, ...parsed.ui },
    };
  } catch {
    return defaultState;
  }
}

function App() {
  const [state, setState] = useState(loadState);
  const { clearSession, syncAuthSession } = useAuth();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.auth.isAuthenticated && state.auth.profile) {
      syncAuthSession(state.auth.profile, state.ui.activeModule || getPhase(state.auth.profile.enlistmentDate));
    } else {
      clearSession();
    }
  }, [clearSession, state.auth.isAuthenticated, state.auth.profile, state.ui.activeModule, syncAuthSession]);

  // Load persisted data from Supabase when a user authenticates
  const supabaseId = state.auth.profile?.supabaseId;
  useEffect(() => {
    if (!supabaseId) return;

    dbService.loadIpptAttempts(supabaseId).then((attempts) => {
      if (attempts?.length) {
        setState((c) => ({
          ...c,
          ippt: { ...c.ippt, attempts, attemptsByAccount: { ...c.ippt.attemptsByAccount, [c.auth.profile.id]: attempts } },
        }));
      }
    });

    dbService.loadJournalEntries(supabaseId).then((entries) => {
      if (entries?.length) setState((c) => ({ ...c, journal: { ...c.journal, entries } }));
    });

    dbService.loadFeedPosts().then((posts) => {
      if (posts?.length) setState((c) => ({ ...c, social: { ...c.social, trainingFeedPosts: posts } }));
    });

    dbService.loadWallPosts().then((posts) => {
      if (posts?.length) setState((c) => ({ ...c, community: { ...c.community, wallPosts: posts } }));
    });

    dbService.loadSwimAttempts(supabaseId).then((attempts) => {
      if (attempts?.length) setState((c) => ({ ...c, swim: { ...c.swim, attempts } }));
    });
  }, [supabaseId]);

  const updateState = (updater) => {
    setState((current) => updater(current));
  };

  return <AppRoutes state={state} updateState={updateState} />;
}

function ModuleHomeRoute({ module, state, updateState, phase }) {
  useEffect(() => {
    updateState((current) => {
      if (current.ui.activeModule === module) return current;
      return { ...current, ui: { ...current.ui, activeModule: module } };
    });
  }, [module, updateState]);

  if (module === 'enlist') {
    return <EnlistDashboardPage state={state} updateState={updateState} phase={phase} />;
  }
  return <HomeDashboard state={state} updateState={updateState} phase={phase} activeModule={module} />;
}

function AppRoutes({ state, updateState }) {
  const isReady = state.auth.isAuthenticated && state.onboarding.ipptGoal && state.onboarding.consented;

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isReady ? '/home' : state.auth.isAuthenticated ? '/setup/goal' : '/login'} replace />}
      />
      <Route path="/login" element={<LandingPage state={state} updateState={updateState} />} />
      <Route path="/setup/goal" element={<GoalSetupPage state={state} updateState={updateState} />} />
      <Route path="/setup/consent" element={<ConsentPage state={state} updateState={updateState} />} />
      <Route
        path="/*"
        element={
          isReady ? (
            <AppShell state={state} updateState={updateState} />
          ) : (
            <Navigate to={state.auth.isAuthenticated ? '/setup/goal' : '/login'} replace />
          )
        }
      />
    </Routes>
  );
}

function AppShell({ state, updateState }) {
  const { setCurrentModule: setAuthCurrentModule } = useAuth();
  const navigate = useNavigate();
  const profile = state.auth.profile;
  const phase = getPhase(profile?.enlistmentDate);
  const activeModule = state.ui.activeModule || phase;
  const branch = state.ui.branch || 'army';

  const setActiveModule = (module) => {
    updateState((current) => ({
      ...current,
      ui: { ...current.ui, activeModule: module },
    }));
    setAuthCurrentModule(module);
    navigate(`/${module}`);
  };

  const setBranch = (b) => {
    updateState((current) => ({
      ...current,
      ui: { ...current.ui, branch: b },
    }));
  };

  const signOut = () => {
    updateState((current) => ({
      ...current,
      auth: { isAuthenticated: false, profile: null },
    }));
    navigate('/login');
  };

  // Strava: write synced runs + swims + athlete into state in one call.
  const setStravaData = (activities, athlete, swims) =>
    updateState((current) => ({
      ...current,
      strava: {
        ...current.strava,
        connected: true,
        activities: Array.isArray(activities) ? activities : [],
        swims: Array.isArray(swims) ? swims : (current.strava?.swims || []),
        athlete: athlete || current.strava?.athlete || null,
        lastSynced: new Date().toISOString(),
      },
    }));

  // Strava: local-only disconnect for the demo (no backend revoke needed).
  const clearStravaData = () =>
    updateState((current) => ({
      ...current,
      strava: { connected: false, athlete: null, activities: [], swims: [], lastSynced: null },
    }));

  return (
    <div className="app-shell" data-branch={branch}>
      <CommandRail
        branch={branch}
        activeModule={activeModule}
        profile={profile}
        onSignOut={signOut}
        onModuleChange={setActiveModule}
      />
      <div className="shell-main">
        <TopBar branch={branch} activeModule={activeModule} onModuleChange={setActiveModule} profile={profile} />
        <main className="screen-body scroll">
          <Routes>
            <Route path="/home" element={<Navigate to={`/${activeModule}`} replace />} />
            <Route
              path="/enlist"
              element={<ModuleHomeRoute module="enlist" state={state} updateState={updateState} phase={phase} />}
            />
            <Route
              path="/serve"
              element={<ModuleHomeRoute module="serve" state={state} updateState={updateState} phase={phase} />}
            />
            <Route path="/fitness-prep" element={<FitnessPrepPage state={state} />} />
            <Route path="/enlist/workout" element={<PreEnlistmentWorkout state={state} updateState={updateState} />} />
            <Route path="/enlist/workout-session/:date" element={<WorkoutSession state={state} updateState={updateState} />} />
            <Route path="/ai-chat" element={<AiChatPage />} />
            <Route path="/peer-intel" element={<PeerIntelPage state={state} />} />
            <Route path="/peer-support" element={<PeerSupportWallScreen state={state} updateState={updateState} />} />
            <Route path="/support-console" element={<SupportConsoleScreen state={state} updateState={updateState} />} />
            <Route path="/buddy-tap" element={<BuddyTapScreen state={state} updateState={updateState} />} />
            <Route path="/escalation" element={<EscalationScreen state={state} updateState={updateState} />} />
            <Route
              path="/community"
              element={<CommunityScreen state={state} updateState={updateState} activeModule={activeModule} />}
            />
            <Route
              path="/journal"
              element={<JournalScreen state={state} updateState={updateState} activeModule={activeModule} />}
            />
            <Route
              path="/train"
              element={<TrainScreen state={state} updateState={updateState} activeModule={activeModule} />}
            />
            <Route path="/weekend-planner" element={<WeekendPlannerScreen state={state} updateState={updateState} activeModule={activeModule} />} />
            <Route path="/training-feed" element={<TrainingFeedScreen state={state} updateState={updateState} setStravaData={setStravaData} />} />
            <Route path="/serve/strava-connect" element={<StravaConnect state={state} setStravaData={setStravaData} clearStravaData={clearStravaData} />} />
            <Route path="/serve/strava-connected" element={<StravaConnect state={state} setStravaData={setStravaData} clearStravaData={clearStravaData} />} />
            <Route path="/serve/strava-error" element={<StravaConnect state={state} setStravaData={setStravaData} clearStravaData={clearStravaData} />} />
            <Route
              path="/profile"
              element={
                <ProfileScreen
                  state={state}
                  updateState={updateState}
                  phase={phase}
                  activeModule={activeModule}
                />
              }
            />
            <Route path="/what-to-expect" element={<WhatToExpectPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}




function getMissionVariant(title, activeModule) {
  if (title.includes('IPPT') || title.includes('Fitness') || title.includes('Workout')) return 'ippt';
  if (title.includes('Sentinel')) return 'sentinel';
  if (title.includes('Buddy') || title.includes('Wall')) return 'buddy';
  if (title.includes('Record')) return 'record';
  if (activeModule === 'enlist') return 'enlist';
  return 'intel';
}

function MissionIcon({ title, variant }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (variant === 'ippt') {
    return <svg {...common}><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></svg>;
  }
  if (title.includes('Sentinel')) {
    return <svg {...common}><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" /><path d="M8.5 13h2l1.2-2.5 1.7 5 1.1-2.5h1" /></svg>;
  }
  if (title.includes('Buddy')) {
    return <svg {...common}><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a2.5 2.5 0 1 0 0-5" /><path d="M3 19c.4-3.3 2-5 5-5s4.6 1.7 5 5M14 14c3.5 0 5.3 1.7 5.7 5" /></svg>;
  }
  if (title.includes('Wall')) {
    return <svg {...common}><path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M2.5 19c.4-3.4 1.9-5 4.5-5s4.1 1.6 4.5 5M12.5 19c.4-3.4 1.9-5 4.5-5s4.1 1.6 4.5 5" /></svg>;
  }
  if (title.includes('Support')) {
    return <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m6.3 6.3 3.6 3.6M14.1 14.1l3.6 3.6M17.7 6.3l-3.6 3.6M9.9 14.1l-3.6 3.6" /></svg>;
  }
  if (variant === 'record') {
    return <svg {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 12h6M9 16h4" /></svg>;
  }
  if (title.includes('Chat')) {
    return <svg {...common}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg>;
  }
  if (title.includes('Advice')) {
    return <svg {...common}><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  }
  return <svg {...common}><path d="M4 19V5h16v14M8 5V3h8v2M8 10h8M8 14h5" /></svg>;
}

function MissionCard({ block, activeModule, onOpen }) {
  const variant = getMissionVariant(block.title, activeModule);

  return (
    <button className={`ops-mission-card mission-${variant}`} type="button" onClick={onOpen}>
      <div className="ops-mission-card-head">
        <span className="ops-mission-icon"><MissionIcon title={block.title} variant={variant} /></span>
      </div>
      <div className="ops-mission-card-body">
        <h2>{block.title}</h2>
        <p>{block.body}</p>
      </div>
      <span className="ops-mission-open">Open mission <b>→</b></span>
    </button>
  );
}

function OperatorHero({ profile, activeModule, branch }) {
  const normalizedBranch = String(branch || 'army').trim().toLowerCase();
  const operatorImage = OPERATOR_BY_BRANCH[normalizedBranch] || armyOperator;
  const operatorLabel =
    operatorImage === navyOperator
      ? 'Singapore Navy serviceman'
      : operatorImage === airforceOperator
        ? 'Singapore Air Force serviceman'
        : operatorImage === disOperator
          ? 'Digital and Intelligence Service serviceman'
          : 'Singapore serviceman';

  return (
    <section className="ops-operator-hero" aria-label="Current service operator">
      <div className="ops-operator-aura" />
      <div className="ops-operator-copy">
        <span className="ops-eyebrow">{activeModule === 'serve' ? 'Active service operator' : 'Pre-enlistment operator'}</span>
        <h1>{toTitleCase(profile.fullName)}</h1>
        <p>
          PES {profile.pesStatus} · {profile.unit} · {(profile.vocation || 'Infantry').toUpperCase()}
        </p>
      </div>
      <div className="ops-operator-visual">
        <img
          key={operatorImage}
          src={operatorImage}
          alt={`${operatorLabel} in field equipment`}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = armyOperator;
          }}
        />
      </div>
    </section>
  );
}

function HomeDashboard({ state, updateState, phase, activeModule }) {
  const navigate = useNavigate();
  const profile = state.auth.profile;
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);
  const moduleContent =
    activeModule === 'enlist'
      ? {
          eyebrow: 'Module 1 · Enlist',
          summary:
            'Built for the pre-enlistee who has zero NS knowledge and maximum uncertainty. Every feature reduces a specific anxiety.',
          detailBlocks: [
            {
              title: 'What to Expect',
              body: 'See what enlistment day looks like before you step through the gates.',
              to: '/what-to-expect',
            },
            {
              title: 'PES-Based Fitness Prep',
              body: 'Build a realistic training plan around your PES and fitness goal.',
              to: '/fitness-prep',
            },
            {
              title: 'AI Chatbot',
              body: 'Get quick, clear answers to the NS questions you do not want to guess.',
              to: '/ai-chat',
            },
            {
              title: 'Batch Advice Feed',
              body: 'Hear the tips servicemen wish they knew before their first day.',
              to: '/peer-intel',
            },
          ],
        }
      : {
          detailBlocks: [
            {
              title: 'Workout Tracker',
              body: 'Log IPPT and vocation-based fitness attempts, set goals, and track your progression.',
              to: '/train',
            },
            {
              title: 'Training Feed',
              body: 'Post IPPT results and training milestones. React and reply to your platoon mates.',
              to: '/training-feed',
            },
            {
              title: 'Sentinel',
              body: 'Check in privately, spot how you have been feeling, and find support when you need it.',
              to: '/journal',
            },
            {
              title: 'Buddy Tap',
              body: 'Quietly look out for a mate when something feels off.',
              to: '/buddy-tap',
            },
            {
              title: 'Peer Intel Feed',
              body: 'Share training wins, swap encouragement, and react to what your mates are achieving.',
              to: '/training-feed',
            },
            {
              title: 'Connect Strava',
              body: 'Sync your runs automatically. Your 2.4km times feed your IPPT tracker and appear in the training feed.',
              to: '/serve/strava-connect',
            },
          ],
        };

  const ipptAttempts = state.ippt.attempts;
  const latestIppt = ipptAttempts.length ? ipptAttempts[ipptAttempts.length - 1] : null;
  const latestScore = latestIppt
    ? calculateIpptScore(latestIppt.pushups, latestIppt.situps, latestIppt.runSeconds)
    : null;
  const streakDays = getJournalStreak(state.journal.entries);
  const branch = state.ui?.branch || 'army';
  const missionBlocks = [
    ...moduleContent.detailBlocks,
    {
      title: 'Service Record',
      body: 'Keep your profile, milestones, and service details together in one place.',
      to: '/profile',
    },
  ];
  const splitIndex = Math.ceil(missionBlocks.length / 2);
  const outreachPrompt = (state.support?.outreachPrompts || []).find(
    (prompt) => prompt.status !== 'dismissed' && (
      prompt.userId === profile.memberId ||
      (profile.fullName === 'Marcus Ng' && prompt.userId === 'platoon-02')
    ),
  );


  return (
    <div className={`dash-page ops-hub ops-branch-${branch}`}>
      <ScreenHeader
        title="Operations Hub"
        className="ops-hub-header"
        action={
          <div className="ops-header-stats">
            <div><span>Current IPPT</span><strong>{latestScore?.score ?? '—'}</strong></div>
            <div><span>Current award</span><strong>{latestScore?.award ?? '—'}</strong></div>
            <div><span>Journal streak</span><strong>{streakDays} nights</strong></div>
            <div><span>Days to ORD</span><strong>{ordDays}</strong></div>
          </div>
        }
      />

      {outreachPrompt && (
        <div className="support-outreach-panel" style={{ marginBottom: 16, padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 6, display: 'block' }}>▲ PRIVATE SUPPORT CHECK-IN</span>
            <h3>Some mates are looking out for you.</h3>
            <p>{outreachPrompt.reason} You can talk to the peer support leader anonymously; they will not see your name.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <button className="primary-button small" onClick={() => navigate('/escalation')}>View support options</button>
            <button className="primary-button small" onClick={() => updateState((current) => {
              const tapperIds = [...new Set(
                (current.community.buddyTaps || [])
                  .filter((tap) => tap.toUserId === outreachPrompt.userId && tap.fromUserId)
                  .map((tap) => tap.fromUserId),
              )];
              const recipientMember = platoonMembers.find((m) => m.id === outreachPrompt.userId);
              const recipientName = recipientMember?.name || 'Your mate';
              const newOkayNotifs = tapperIds.map((tapperId) => ({
                id: `okay-${tapperId}-${Date.now()}`,
                toUserId: tapperId,
                recipientMemberId: outreachPrompt.userId,
                recipientName,
                timestamp: new Date().toISOString(),
                read: false,
              }));
              return {
                ...current,
                support: {
                  ...current.support,
                  outreachPrompts: (current.support?.outreachPrompts || []).map(
                    (p) => p.id === outreachPrompt.id ? { ...p, status: 'dismissed' } : p,
                  ),
                  okayNotifications: [...(current.support?.okayNotifications || []), ...newOkayNotifs],
                },
              };
            })}>I'm okay</button>
          </div>
        </div>
      )}

      <div className="ops-mission-layout">
        <div className="ops-mission-column ops-mission-column-left">
          {missionBlocks.slice(0, splitIndex).map((block) => (
            <MissionCard
              key={block.title}
              block={block}
              activeModule={activeModule}
              onOpen={() => navigate(block.to)}
            />
          ))}
        </div>

        <OperatorHero
          profile={profile}
          activeModule={activeModule}
          branch={branch}
        />

        <div className="ops-mission-column ops-mission-column-right">
          {missionBlocks.slice(splitIndex).map((block) => (
            <MissionCard
              key={block.title}
              block={block}
              activeModule={activeModule}
              onOpen={() => navigate(block.to)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}



function CommunityScreen({ state, updateState, activeModule }) {
  return activeModule === 'enlist' ? (
    <PeerIntelPage state={state} />
  ) : (
    <PeerSupportWallScreen state={state} updateState={updateState} />
  );
}


function PeerSupportWallScreen({ state, updateState }) {
  const { user: authUser } = useAuth();
  const supabaseId = authUser?.supabaseId || state.auth.profile?.supabaseId;
  const myPostIds  = useRef(new Set());
  return (
    <section className="feed-screen">
      <ScreenHeader
        title="Peer Support Wall"
        subtitle="Named support posts by phase and topic, with resources surfaced before anything goes live."
      />
      <FeedScreenContent
        posts={state.community.wallPosts}
        onAddPost={async (post) => {
          const dbId = await dbService.saveWallPost(supabaseId, post);
          const postWithDbId = dbId ? { ...post, _dbId: dbId, userId: supabaseId } : post;
          myPostIds.current.add(postWithDbId.id);
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: [postWithDbId, ...current.community.wallPosts],
            },
          }));
        }}
        onReply={(postId, reply) => {
          const post = (state.community?.wallPosts || []).find((p) => p.id === postId);
          dbService.saveWallReply(post?._dbId || postId, supabaseId, reply.text);
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: current.community.wallPosts.map((p) =>
                p.id === postId ? { ...p, replies: [...(p.replies || []), reply] } : p,
              ),
            },
          }));
        }}
        onVote={(postId, upDelta, downDelta) =>
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: current.community.wallPosts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      upvotes: Math.max(0, (post.upvotes || 0) + upDelta),
                      downvotes: Math.max(0, (post.downvotes || 0) + downDelta),
                    }
                  : post,
              ),
            },
          }))
        }
        onDeletePost={(postId, dbId) => {
          myPostIds.current.delete(postId);
          dbService.deleteWallPost(dbId);
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: current.community.wallPosts.filter((p) => p.id !== postId),
            },
          }));
        }}
        isMyPost={(post) => myPostIds.current.has(post.id) || (supabaseId && post.userId === supabaseId)}
        feedType="wall"
        moderate={nlpService.moderate}
        emptyText="Be the first to post to the wall."
        composeTitle="Submit Support Post"
        composePlaceholder="Share support, what helped, or something others in service may need to hear."
      />
    </section>
  );
}

function FeedScreenContent({
  posts,
  onAddPost,
  onReply,
  onVote,
  onDeletePost,
  isMyPost,
  feedType,
  moderate,
  emptyText,
  composeTitle,
  composePlaceholder,
  fullWidth = false,
}) {
  const isWall = feedType === 'wall';
  const [primaryFilter, setPrimaryFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDraft, setPostDraft] = useState('');
  const [postPhase, setPostPhase] = useState(wallPhases[0].value);
  const [composeError, setComposeError] = useState('');
  const [distressPrompt, setDistressPrompt] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [userVotes, setUserVotes] = useState({});

  const filterKey = feedType === 'intel' ? 'category' : isWall ? 'phase' : 'topic';
  const filterOptions = isWall
    ? [{ value: 'All', label: 'All' }, ...wallPhases]
    : ['All', ...new Set(posts.map((post) => post[filterKey]).filter(Boolean))].map((value) => ({
        value,
        label: value,
      }));
  const phaseLabel = (value) => wallPhases.find((p) => p.value === value)?.label || value;

  const filteredPosts = posts.filter(
    (post) => primaryFilter === 'All' || post[filterKey] === primaryFilter,
  );

  const resetCompose = () => {
    setPostTitle('');
    setPostDraft('');
    setComposeError('');
    setDistressPrompt(false);
    setShowCompose(false);
  };

  const handleVote = (postId, direction) => {
    const current = userVotes[postId];
    let upDelta = 0;
    let downDelta = 0;
    let newVote;

    if (direction === 'up') {
      if (current === 'up') { upDelta = -1; newVote = null; }
      else if (current === 'down') { upDelta = 1; downDelta = -1; newVote = 'up'; }
      else { upDelta = 1; newVote = 'up'; }
    } else {
      if (current === 'down') { downDelta = -1; newVote = null; }
      else if (current === 'up') { downDelta = 1; upDelta = -1; newVote = 'down'; }
      else { downDelta = 1; newVote = 'down'; }
    }

    setUserVotes((v) => ({ ...v, [postId]: newVote }));
    onVote?.(postId, upDelta, downDelta);
  };

  const publishWallPost = (distressFlag) => {
    onAddPost({
      id: Date.now(),
      author: 'Anonymous NSF',
      phase: postPhase,
      title: postTitle.trim() || undefined,
      content: postDraft.trim(),
      createdAt: getToday().toISOString(),
      distressFlag,
      upvotes: 0,
      downvotes: 0,
      replies: [],
    });
    resetCompose();
  };

  const addPost = async () => {
    if (!postDraft.trim()) return;

    // Intel feed: no moderation, original behaviour.
    if (!isWall) {
      onAddPost({
        id: Date.now(),
        author: 'Anonymous Fieldnote',
        [filterKey]: primaryFilter === 'All' ? 'General' : primaryFilter,
        content: postDraft.trim(),
        createdAt: getToday().toISOString(),
      });
      resetCompose();
      return;
    }

    // Wall feed: run moderation before anything goes live.
    setPosting(true);
    setComposeError('');
    const verdict = moderate ? await moderate(postDraft.trim()) : { approved: true, distress: false, reason: '' };
    setPosting(false);

    if (!verdict.approved) {
      setComposeError(verdict.reason || 'We get it — NS is tough and things can pile up. This wall is here for everyone though, so try rephrasing with a bit more kindness. Your story matters and others want to hear it.');
      return;
    }

    if (verdict.distress && !distressPrompt) {
      // Surface resources before publishing; the writer can still choose to post.
      setDistressPrompt(true);
      return;
    }

    publishWallPost(Boolean(verdict.distress) || distressPrompt);
  };

  const submitReply = async (postId) => {
    const draft = (replyDrafts[postId] || '').trim();
    if (!draft || !onReply) return;

    if (moderate) {
      const verdict = await moderate(draft);
      if (!verdict.approved) {
        setReplyErrors((e) => ({
          ...e,
          [postId]: verdict.reason || 'Replies here are meant to support, not tear down. Try coming at it from a place of encouragement — even a small shift in tone makes a real difference to someone who is struggling.',
        }));
        return;
      }
    }
    setReplyErrors((e) => ({ ...e, [postId]: '' }));

    onReply(postId, {
      id: `${postId}-${Date.now()}`,
      author: 'Anonymous peer',
      text: draft,
      createdAt: getToday().toISOString(),
    });

    setReplyDrafts((current) => ({ ...current, [postId]: '' }));
    setReplyingToId(null);
  };

  return (
    <>
      <div className="filter-bar">
        <select value={primaryFilter} onChange={(event) => setPrimaryFilter(event.target.value)}>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`feed-list ${fullWidth ? 'feed-list-full' : ''}`}>
        {filteredPosts.length === 0 ? (
          <div className="empty-state">{emptyText}</div>
        ) : (
          filteredPosts.map((post) => {
            const expanded = post.id === expandedId;
            const replyCount = post.replies?.length || 0;

            return (
              <article key={post.id} className="feed-card" onClick={() => setExpandedId(post.id)}>
                <div className="feed-meta">
                  <div>
                    <strong>{post.author}</strong>
                    <span>{shortDate((post.createdAt || getToday().toISOString()).slice(0, 10))}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {feedType === 'intel' && <span className="verified-badge">Q&A</span>}
                    {onDeletePost && isMyPost?.(post) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePost(post.id, post._dbId); }}
                        title="Delete post"
                        style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 15, lineHeight: 1, padding: '2px 4px' }}
                      >✕</button>
                    )}
                  </div>
                </div>
                <div className="badge-row">
                  <span className="info-badge">{isWall ? phaseLabel(post.phase) : post[filterKey]}</span>
                  {isWall && post.topic && <span className="info-badge">{post.topic}</span>}
                </div>
                {feedType === 'wall' && (
                  <h3 className="feed-card-title">{post.title || post.topic}</h3>
                )}
                <p className={expanded ? 'feed-card-body' : 'feed-card-body clamped'}>{post.content}</p>
                {feedType === 'wall' && (
                  <div className="feed-thread-meta">
                    <button
                      type="button"
                      className={`thread-stat thread-vote${userVotes[post.id] === 'up' ? ' vote-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleVote(post.id, 'up');
                      }}
                    >
                      ▲ {post.upvotes || 0}
                    </button>
                    <button
                      type="button"
                      className={`thread-stat thread-vote${userVotes[post.id] === 'down' ? ' vote-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleVote(post.id, 'down');
                      }}
                    >
                      ▼ {post.downvotes || 0}
                    </button>
                    <span className="reply-count">{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                  </div>
                )}
                {feedType === 'wall' && expanded && (
                  <div className="reply-thread" onClick={(event) => event.stopPropagation()}>
                    <div className="reply-list">
                      {(post.replies || []).length === 0 ? (
                        <div className="empty-state">No replies yet. Be the first to respond.</div>
                      ) : (
                        (post.replies || []).map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-meta">
                              <strong>{reply.author}</strong>
                              <span>{shortDate((reply.createdAt || getToday().toISOString()).slice(0, 10))}</span>
                            </div>
                            <p>{reply.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {replyingToId === post.id ? (
                      <div className="reply-composer">
                        <textarea
                          value={replyDrafts[post.id] || ''}
                          onChange={(event) =>
                            setReplyDrafts((current) => ({
                              ...current,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder="Reply with encouragement, advice, or what helped you."
                          rows={3}
                        />
                        {replyErrors[post.id] && (
                          <p className="inline-warning">{replyErrors[post.id]}</p>
                        )}
                        <div className="reply-actions">
                          <button type="button" className="secondary-button reply-button" onClick={() => setReplyingToId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="primary-button small" onClick={() => submitReply(post.id)}>
                            Post reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="secondary-button reply-button" onClick={() => setReplyingToId(post.id)}>
                        Reply to thread
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setShowCompose(true)}>
        +
      </button>
      {showCompose && (
        <Modal title={composeTitle} onClose={resetCompose}>
          {isWall && (
            <div className="compose-selectors">
              <label>
                <span>Phase</span>
                <select value={postPhase} onChange={(event) => setPostPhase(event.target.value)}>
                  {wallPhases.map((phase) => (
                    <option key={phase.value} value={phase.value}>
                      {phase.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {isWall && (
            <input
              type="text"
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="Short title (optional)"
            />
          )}
          <textarea
            value={postDraft}
            onChange={(event) => {
              setPostDraft(event.target.value);
              if (composeError) setComposeError('');
            }}
            placeholder={composePlaceholder}
            rows={6}
          />
          {composeError && <p className="inline-warning">{composeError}</p>}
          {distressPrompt ? (
            <div className="distress-banner">
              <strong>You don't have to carry this alone.</strong>
              <p>
                It sounds like things are heavy right now. You can still post — and these are here for you, only you:
              </p>
              <ul className="resource-list">
                {crisisResources.resources.slice(0, 3).map((resource) => (
                  <li key={resource.name}>
                    {resource.name}: {resource.number}
                  </li>
                ))}
              </ul>
              <div className="action-grid">
                <button className="primary-button small" onClick={addPost} disabled={posting}>
                  Post anyway
                </button>
                <button className="soft-button" onClick={resetCompose}>
                  Maybe later
                </button>
              </div>
            </div>
          ) : (
            <button className="primary-button" onClick={addPost} disabled={posting}>
              {posting ? 'Checking…' : 'Post'}
            </button>
          )}
        </Modal>
      )}
    </>
  );
}

function BuddyTapScreen({ state, updateState }) {
  const selectableBuddies = useMemo(
    () => platoonMembers.filter((member) => member.id !== state.auth.profile?.memberId),
    [state.auth.profile?.memberId],
  );
  const [buddyId, setBuddyId] = useState(selectableBuddies[0]?.id || '');
  const [buddyComment, setBuddyComment] = useState('');
  const [submittedConcern, setSubmittedConcern] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [thresholdNotice, setThresholdNotice] = useState(null);

  const profile = state.auth.profile;
  const taps = state.community.buddyTaps || [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCount = taps.filter((tap) => new Date(tap.timestamp).getTime() >= weekAgo).length;
  const myOkayNotifs = (state.support?.okayNotifications || []).filter(
    (n) => n.toUserId === profile?.memberId && !n.read,
  );

  useEffect(() => {
    if (!selectableBuddies.some((member) => member.id === buddyId)) {
      setBuddyId(selectableBuddies[0]?.id || '');
    }
  }, [buddyId, selectableBuddies]);

  const submitConcern = async () => {
    if (!buddyId) return;
    if (!buddyComment.trim()) {
      setBlockReason('Add a short note on what you noticed so the support message feels grounded.');
      return;
    }
    setChecking(true);
    setBlockReason('');

    const verdict = await nlpService.moderateBuddy(buddyComment.trim());
    setChecking(false);

    if (!verdict.approved) {
      setBlockReason(verdict.reason || 'Buddy Tap is meant for genuine welfare concerns — things you have actually observed that worry you about your buddy\'s wellbeing. If you have noticed something specific, try describing that instead.');
      return;
    }

    const member = selectableBuddies.find((m) => m.id === buddyId);
    const priorCount = taps.filter((tap) => tap.toUserId === buddyId).length;
    const newCount = priorCount + 1;

    dbService.saveBuddyTap(state.auth.profile?.supabaseId, buddyId, buddyComment.trim());

    updateState((current) => ({
      ...current,
      community: {
        ...current.community,
        buddyTaps: [
          ...(current.community.buddyTaps || []),
          { id: Date.now(), toUserId: buddyId, fromUserId: current.auth.profile?.memberId, text: buddyComment.trim(), timestamp: new Date().toISOString() },
        ],
      },
    }));

    setSubmittedConcern(true);

    if (newCount >= 3) {
      const outreachReason = 'A few people in your unit noticed you may be having a rough week.';
      updateState((current) => {
        const prompts = current.support?.outreachPrompts || [];
        const hasOpenPrompt = prompts.some((prompt) => prompt.userId === buddyId && prompt.status !== 'dismissed');
        if (!hasOpenPrompt) dbService.saveOutreachPrompt(buddyId, outreachReason);
        return {
          ...current,
          support: {
            ...current.support,
            outreachPrompts: hasOpenPrompt
              ? prompts
              : [
                  ...prompts,
                  {
                    id: `outreach-${buddyId}-${Date.now()}`,
                    userId: buddyId,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    reason: outreachReason,
                  },
                ],
          },
        };
      });
      setThresholdNotice(notify('buddy_threshold', { recipientName: member?.name }));
    }
  };

  const reset = () => {
    setSubmittedConcern(false);
    setBuddyComment('');
    setBlockReason('');
  };

  return (
    <section>
      <ScreenHeader
        title="Buddy Tap"
        subtitle="Anonymous single-action concern flag. Three independent taps trigger a supportive message directly to the person."
      />
      <div className="badge-row">
        <span className="info-badge">No commander is notified. No one is identified.</span>
      </div>
      {myOkayNotifs.map((notif) => (
        <div key={notif.id} className="panel" style={{ padding: '16px 20px', marginBottom: 14, borderLeftColor: 'var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <span className="label" style={{ color: 'var(--success)', marginBottom: 4, display: 'block' }}>▲ UPDATE FROM YOUR CHECK-IN</span>
            <p style={{ margin: 0 }}><strong>{notif.recipientName}</strong> saw your concern and said they're okay. Thanks for looking out for them.</p>
          </div>
          <button className="soft-button" style={{ flexShrink: 0 }} onClick={() => updateState((current) => ({
            ...current,
            support: {
              ...current.support,
              okayNotifications: (current.support.okayNotifications || []).map(
                (n) => n.id === notif.id ? { ...n, read: true } : n,
              ),
            },
          }))}>Got it</button>
        </div>
      ))}
      <div className="buddy-card">
        <h2>Cover a mate.</h2>
        <p>If someone seems off, let us know. Three independent reports send them an anonymous message of support. No names. No commanders.</p>
        {!submittedConcern ? (
          <>
            <select value={buddyId} onChange={(event) => setBuddyId(event.target.value)}>
              {selectableBuddies.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.rank} {member.name}
                </option>
              ))}
            </select>
            <textarea
              className="rose-input"
              value={buddyComment}
              onChange={(event) => setBuddyComment(event.target.value)}
              placeholder="What did you notice? Add brief context so the support message can feel more grounded."
              rows={4}
            />
            {blockReason && <p className="inline-warning">{blockReason}</p>}
            <button className="primary-button" onClick={submitConcern} disabled={checking}>
              {checking ? 'Checking…' : 'Send concern'}
            </button>
          </>
        ) : (
          <div className="confirmation-card">
            <div className="checkmark">✓</div>
            <p>Noted. Your concern was recorded anonymously.</p>
            <button className="soft-button" onClick={reset}>
              Tap for someone else
            </button>
          </div>
        )}
        <small>
          Three independent reports about the same person triggers an anonymous message sent directly to them: "Some people in your unit are thinking about you. Here are some resources." No one is identified. No superior is notified.
        </small>
      </div>

      {thresholdNotice && (
        <Modal title={thresholdNotice.title} onClose={() => setThresholdNotice(null)}>
          <p>{thresholdNotice.message}</p>
          {thresholdNotice.body && <p>{thresholdNotice.body}</p>}
          {thresholdNotice.resources?.length > 0 && (
            <ul className="resource-list">
              {thresholdNotice.resources.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <small>{thresholdNotice.footer}</small>
          <button className="primary-button" onClick={() => setThresholdNotice(null)}>
            Close
          </button>
        </Modal>
      )}
    </section>
  );
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const BLANK_FORM = () => ({ pushups: '', situps: '', runMins: '', runSecs: '', date: todayIso() });

function AttemptForm({ form, setForm, stravaActivities = [], stravaConnected = false, onConnectStrava }) {
  const dateRef = useRef(null);
  const [showStravaImport, setShowStravaImport] = useState(false);
  const clampSecs = (v) => String(Math.min(59, Math.max(0, parseInt(v) || 0))).padStart(2, '0');

  // Only runs close to 2.4km are relevant; show the 10 most recent.
  const importableRuns = (stravaActivities || [])
    .filter((run) => parseFloat(run.distanceKm) >= 2.2)
    .slice(0, 10);

  const importRun = (run) => {
    const secs = Number(run.durationSeconds) || 0;
    setForm({ ...form, runMins: String(Math.floor(secs / 60)), runSecs: String(secs % 60).padStart(2, '0') });
    setShowStravaImport(false);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 20px' }}>
      {[
        { label: 'PUSH-UPS', field: 'pushups', type: 'number', min: 0 },
        { label: 'SIT-UPS',  field: 'situps',  type: 'number', min: 0 },
      ].map(({ label, field, type, min }) => (
        <div key={field}>
          <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>{label}</div>
          <input
            type={type}
            min={min}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            style={{ width: '100%' }}
            placeholder="—"
          />
        </div>
      ))}
      <div>
        <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>2.4KM RUN TIME</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number" min="0" max="30"
            value={form.runMins}
            onChange={(e) => setForm({ ...form, runMins: e.target.value })}
            style={{ width: '100%', textAlign: 'center' }}
            placeholder="MM"
          />
          <span className="mono" style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: 18 }}>:</span>
          <input
            type="number" min="0" max="59"
            value={form.runSecs}
            onBlur={(e) => setForm({ ...form, runSecs: clampSecs(e.target.value) })}
            onChange={(e) => setForm({ ...form, runSecs: e.target.value })}
            style={{ width: '100%', textAlign: 'center' }}
            placeholder="SS"
          />
        </div>
        <div className="mono-dim" style={{ fontSize: 9, marginTop: 4 }}>MM : SS</div>
        {onConnectStrava && (
          stravaConnected ? (
            <button
              type="button"
              onClick={() => setShowStravaImport(true)}
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid #FC4C02', color: '#FC4C02',
                borderRadius: 5, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
              }}
            >
              ⬇ IMPORT FROM STRAVA
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectStrava}
              title="Connect Strava to import your runs"
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-faint)',
                borderRadius: 5, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
              }}
            >
              CONNECT STRAVA FIRST
            </button>
          )
        )}
      </div>
      <div>
        <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>DATE</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={dateRef}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => { try { dateRef.current?.showPicker(); } catch { dateRef.current?.click(); } }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'var(--text-dim)', fontSize: 16, lineHeight: 1,
            }}
            title="Open calendar"
          >
            📅
          </button>
        </div>
      </div>
    </div>

    {showStravaImport && (
      <Modal title="Import from Strava" onClose={() => setShowStravaImport(false)}>
        {importableRuns.length === 0 ? (
          <div className="empty-state">No 2.4km runs found in your Strava history</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="mono-dim" style={{ fontSize: 11, margin: '0 0 4px' }}>
              Tap a run to use its time for the 2.4km station.
            </p>
            {importableRuns.map((run) => (
              <button key={run.stravaId} type="button" className="strava-run-pick" onClick={() => importRun(run)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 13 }}>{run.name}</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#FC4C02' }}>
                    {stravaService.formatDuration(run.durationSeconds)}
                  </span>
                </div>
                <div className="mono-dim" style={{ fontSize: 11, marginTop: 4 }}>
                  {stravaService.formatRunDate(run.date)} · {run.distanceKm} km · {run.pacePerKm} /km
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    )}
    </>
  );
}

const SWIM_PASS_SECONDS = 50 * 60; // NDU 2km sea swim pass standard: 50 minutes

const BLANK_SWIM_FORM = () => ({ swimMins: '', swimSecs: '', date: todayIso() });

function SwimAttemptForm({ form, setForm, stravaSwims = [], stravaConnected = false, onConnectStrava }) {
  const dateRef = useRef(null);
  const [showStravaImport, setShowStravaImport] = useState(false);
  const clampSecs = (v) => String(Math.min(59, Math.max(0, parseInt(v) || 0))).padStart(2, '0');

  // Real swim sessions only (≥1km), 10 most recent.
  const importableSwims = (stravaSwims || [])
    .filter((s) => parseFloat(s.distanceKm) >= 1.0)
    .slice(0, 10);

  const importSwim = (swim) => {
    const secs = Number(swim.durationSeconds) || 0;
    setForm({ ...form, swimMins: String(Math.floor(secs / 60)), swimSecs: String(secs % 60).padStart(2, '0') });
    setShowStravaImport(false);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>2KM SEA SWIM TIME</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min="0" max="120" placeholder="MM"
            value={form.swimMins}
            onChange={(e) => setForm({ ...form, swimMins: e.target.value })}
            style={{ width: 64, textAlign: 'center' }}
          />
          <span style={{ color: 'var(--text-dim)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>:</span>
          <input
            type="number" min="0" max="59" placeholder="SS"
            value={form.swimSecs}
            onBlur={(e) => setForm({ ...form, swimSecs: clampSecs(e.target.value) })}
            onChange={(e) => setForm({ ...form, swimSecs: e.target.value })}
            style={{ width: 64, textAlign: 'center' }}
          />
        </div>
        <div className="mono-dim" style={{ fontSize: 9, marginTop: 4 }}>MM : SS (max 120 min)</div>
        {onConnectStrava && (
          stravaConnected ? (
            <button
              type="button"
              onClick={() => setShowStravaImport(true)}
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid #FC4C02', color: '#FC4C02',
                borderRadius: 5, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
              }}
            >
              ⬇ IMPORT FROM STRAVA
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectStrava}
              title="Connect Strava to import your swims"
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-faint)',
                borderRadius: 5, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
              }}
            >
              CONNECT STRAVA FIRST
            </button>
          )
        )}
      </div>
      <div>
        <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>DATE</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={dateRef} type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => { try { dateRef.current?.showPicker(); } catch { dateRef.current?.click(); } }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-dim)', fontSize: 16, lineHeight: 1 }}
            title="Open calendar"
          >📅</button>
        </div>
      </div>
    </div>

    {showStravaImport && (
      <Modal title="Import Swim from Strava" onClose={() => setShowStravaImport(false)}>
        {importableSwims.length === 0 ? (
          <div className="empty-state">No swims found in your Strava history</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="mono-dim" style={{ fontSize: 11, margin: '0 0 4px' }}>
              Tap a swim to use its time for your 2km sea swim.
            </p>
            {importableSwims.map((swim) => (
              <button key={swim.stravaId} type="button" className="strava-run-pick" onClick={() => importSwim(swim)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 13 }}>{swim.name}</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#FC4C02' }}>
                    {stravaService.formatDuration(swim.durationSeconds)}
                  </span>
                </div>
                <div className="mono-dim" style={{ fontSize: 11, marginTop: 4 }}>
                  {stravaService.formatRunDate(swim.date)} · {swim.distanceKm} km · {swim.pacePer100m} /100m
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    )}
    </>
  );
}

function TrainScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(BLANK_FORM());
  const [editIdx, setEditIdx]         = useState(null);
  const [editForm, setEditForm]       = useState(null);
  const [highlightedAttempt, setHighlightedAttempt] = useState(null);
  const [pbModal, setPbModal]         = useState(null);
  const historyRef = useRef(null);

  // Sea swim state
  const [showSwimModal, setShowSwimModal] = useState(false);
  const [swimForm, setSwimForm]           = useState(BLANK_SWIM_FORM());
  const [swimEditIdx, setSwimEditIdx]     = useState(null);
  const [swimEditForm, setSwimEditForm]   = useState(null);

  const attempts = state.ippt.attempts;
  const latest   = attempts.length ? attempts[attempts.length - 1] : null;

  const latestScore = latest
    ? calculateIpptScore(latest.pushups, latest.situps, latest.runSeconds)
    : null;

  const stationPts = latest
    ? {
        pushups: Math.min(25, Math.floor(latest.pushups / 2)),
        situps:  Math.min(25, Math.floor(latest.situps / 2)),
        run:     Math.max(0, Math.min(50, Math.round((900 - latest.runSeconds) / 6))),
      }
    : null;

  const GOAL_MAP  = { Gold: 85, Silver: 75, 'Pass with Incentive': 61, Pass: 51 };
  const goalName  = state.onboarding.ipptGoal || 'Pass';
  const goalScore = GOAL_MAP[goalName] ?? 61;

  const pbs     = attempts.length ? getPbs(attempts) : null;
  const profile = state.auth.profile;
  const accountId = profile?.id || 'recruit-tan';

  const feed = state.social?.trainingFeed ?? trainingActivity ?? [];

  // Sea swim derivations
  const swimAttempts    = state.swim?.attempts || [];
  const swimLatest      = swimAttempts.length ? swimAttempts[swimAttempts.length - 1] : null;
  const swimPbSeconds   = swimAttempts.length ? Math.min(...swimAttempts.map((a) => a.timeSeconds)) : null;
  const swimPassed      = swimLatest ? swimLatest.timeSeconds <= SWIM_PASS_SECONDS : null;
  const swimFormToSecs  = (f) => (parseInt(f.swimMins) || 0) * 60 + (parseInt(f.swimSecs) || 0);

  const handleChartDotClick = (chartIdx) => {
    setHighlightedAttempt(chartIdx);
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setHighlightedAttempt(null), 2000);
  };

  const chartSeries = attempts.map((a) => ({
    v:     calculateIpptScore(a.pushups, a.situps, a.runSeconds).score,
    label: shortDate(a.date),
  }));

  const formToSeconds = (f) => (parseInt(f.runMins) || 0) * 60 + (parseInt(f.runSecs) || 0);

  const submitAttempt = async () => {
    const runSeconds = formToSeconds(form);
    if (!form.pushups || !form.situps || !runSeconds) return;
    const pushups = Number(form.pushups);
    const situps  = Number(form.situps);
    const newAttempt = { date: form.date, pushups, situps, runSeconds };

    // Detect new personal bests before state update
    const newPbs = [];
    if (!attempts.length || pushups > (pbs?.pushups ?? 0))
      newPbs.push({ exercise: 'Push-ups', value: `${pushups} reps` });
    if (!attempts.length || situps > (pbs?.situps ?? 0))
      newPbs.push({ exercise: 'Sit-ups', value: `${situps} reps` });
    if (!attempts.length || runSeconds < (pbs?.runSeconds ?? 99999))
      newPbs.push({ exercise: '2.4km Run', value: formatRunTime(runSeconds) });

    const dbId = await dbService.saveIpptAttempt(state.auth.profile?.supabaseId, newAttempt);
    const attempt = { ...newAttempt, _dbId: dbId };

    updateState((c) => ({
      ...c,
      ippt: {
        ...c.ippt,
        attempts: [...c.ippt.attempts, attempt],
        attemptsByAccount: {
          ...(c.ippt.attemptsByAccount || {}),
          [accountId]: [...c.ippt.attempts, attempt],
        },
      },
    }));
    setShowModal(false);
    setForm(BLANK_FORM());

    if (newPbs.length > 0) {
      setPbModal({ newPbs, newAttemptIdx: attempts.length });
    }
  };

  const openEdit = (originalIdx) => {
    const a = attempts[originalIdx];
    const totalSecs = a.runSeconds;
    setEditIdx(originalIdx);
    setEditForm({
      pushups: String(a.pushups),
      situps:  String(a.situps),
      runMins: String(Math.floor(totalSecs / 60)),
      runSecs: String(totalSecs % 60).padStart(2, '0'),
      date:    a.date,
    });
  };

  const saveEdit = () => {
    const runSeconds = formToSeconds(editForm);
    if (!editForm.pushups || !editForm.situps || !runSeconds) return;
    const updated_attempt = { date: editForm.date, pushups: Number(editForm.pushups), situps: Number(editForm.situps), runSeconds };
    updateState((c) => {
      const updated = [...c.ippt.attempts];
      const dbId = updated[editIdx]?._dbId;
      updated[editIdx] = { ...updated_attempt, _dbId: dbId };
      dbService.updateIpptAttempt(dbId, updated_attempt);
      return {
        ...c,
        ippt: {
          ...c.ippt,
          attempts: updated,
          attemptsByAccount: { ...(c.ippt.attemptsByAccount || {}), [accountId]: updated },
        },
      };
    });
    setEditIdx(null);
    setEditForm(null);
  };

  const deleteAttempt = (originalIdx) => {
    updateState((c) => {
      const dbId = c.ippt.attempts[originalIdx]?._dbId;
      dbService.deleteIpptAttempt(dbId);
      const updated = c.ippt.attempts.filter((_, i) => i !== originalIdx);
      return {
        ...c,
        ippt: {
          ...c.ippt,
          attempts: updated,
          attemptsByAccount: { ...(c.ippt.attemptsByAccount || {}), [accountId]: updated },
        },
      };
    });
    setEditIdx(null);
    setEditForm(null);
  };

  const submitSwimAttempt = async () => {
    const timeSeconds = swimFormToSecs(swimForm);
    if (!timeSeconds) return;
    const newAttempt = { date: swimForm.date, timeSeconds };
    const isNewPb = !swimAttempts.length || timeSeconds < (swimPbSeconds ?? 99999);
    const dbId = await dbService.saveSwimAttempt(state.auth.profile?.supabaseId, newAttempt);
    const attempt = { ...newAttempt, _dbId: dbId };
    updateState((c) => ({ ...c, swim: { ...c.swim, attempts: [...(c.swim?.attempts || []), attempt] } }));
    setShowSwimModal(false);
    setSwimForm(BLANK_SWIM_FORM());
    if (isNewPb) setPbModal({ newPbs: [{ exercise: '2km Sea Swim', value: formatRunTime(timeSeconds) }], newAttemptIdx: swimAttempts.length });
  };

  const openSwimEdit = (idx) => {
    const a = swimAttempts[idx];
    setSwimEditIdx(idx);
    setSwimEditForm({ swimMins: String(Math.floor(a.timeSeconds / 60)), swimSecs: String(a.timeSeconds % 60).padStart(2, '0'), date: a.date });
  };

  const saveSwimEdit = () => {
    const timeSeconds = swimFormToSecs(swimEditForm);
    if (!timeSeconds) return;
    const updated_attempt = { date: swimEditForm.date, timeSeconds };
    updateState((c) => {
      const updated = [...(c.swim?.attempts || [])];
      const dbId = updated[swimEditIdx]?._dbId;
      updated[swimEditIdx] = { ...updated_attempt, _dbId: dbId };
      dbService.updateSwimAttempt(dbId, updated_attempt);
      return { ...c, swim: { ...c.swim, attempts: updated } };
    });
    setSwimEditIdx(null);
    setSwimEditForm(null);
  };

  const deleteSwimAttempt = (idx) => {
    updateState((c) => {
      const dbId = (c.swim?.attempts || [])[idx]?._dbId;
      dbService.deleteSwimAttempt(dbId);
      return { ...c, swim: { ...c.swim, attempts: (c.swim?.attempts || []).filter((_, i) => i !== idx) } };
    });
    setSwimEditIdx(null);
    setSwimEditForm(null);
  };

  const stationRows = [
    { label: 'PUSH-UPS',  val: latest?.pushups,                                  pts: stationPts?.pushups, max: 25 },
    { label: 'SIT-UPS',   val: latest?.situps,                                   pts: stationPts?.situps,  max: 25 },
    { label: '2.4KM RUN', val: latest ? formatRunTime(latest.runSeconds) : null,  pts: stationPts?.run,     max: 50 },
  ];

  const goalColors = { Gold: 'var(--amber)', Silver: '#9ca3af', 'Pass with Incentive': 'var(--accent-text)', Pass: 'var(--accent-text)' };
  const goalColor  = goalColors[goalName] || 'var(--accent-text)';

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 8, display: 'block' }}>
        ▲ SERVE · WORKOUT TRACKER
      </span>
      <h1 className="h-display" style={{ fontSize: 52, marginBottom: 10 }}>WORKOUT TRACKER</h1>

      {/* GOAL SUB-HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <span className="mono-dim" style={{ fontSize: 12 }}>CURRENT TARGET</span>
        <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: goalColor, letterSpacing: '0.04em' }}>
          {goalName.toUpperCase()}
        </span>
        <span className="mono-dim" style={{ fontSize: 11 }}>{goalScore} PTS</span>
      </div>

      {/* PERSONAL BESTS */}
      <Panel ticks style={{ padding: 26, marginBottom: 16 }}>
        <span className="label" style={{ marginBottom: 18, display: 'block' }}>▲ PERSONAL BESTS · ALL TIME</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'PUSH-UPS',      value: pbs ? pbs.pushups : '—',                          unit: 'REPS',  color: 'var(--amber)' },
            { label: 'SIT-UPS',       value: pbs ? pbs.situps : '—',                            unit: 'REPS',  color: 'var(--amber)' },
            { label: '2.4KM RUN',     value: pbs ? formatRunTime(pbs.runSeconds) : '—',          unit: 'MM:SS', color: 'var(--amber)' },
            { label: '2KM SEA SWIM',  value: swimPbSeconds != null ? formatRunTime(swimPbSeconds) : '—', unit: 'MM:SS', color: 'var(--accent-text)' },
          ].map(({ label, value, unit, color }, i, arr) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 16px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 56, lineHeight: 1, color, marginBottom: 10 }}>{value}</div>
              <div className="label" style={{ marginBottom: 2 }}>{label}</div>
              <div className="mono-dim" style={{ fontSize: 9 }}>{unit}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Row 1: 2-column overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 16, marginBottom: 16 }}>
        <Panel ticks style={{ padding: 26 }}>
          <span className="label" style={{ marginBottom: 18, display: 'block' }}>CURRENT STANDING</span>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 76, lineHeight: 1, color: 'var(--amber)', marginBottom: 14 }}>
            {latestScore ? latestScore.score : '—'}
          </div>
          {latestScore && <Award award={latestScore.award} />}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="mono-dim">GOAL · {goalName.toUpperCase()}</span>
              <span className="mono-dim">{goalScore} PTS</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, ((latestScore?.score ?? 0) / goalScore) * 100)}%`, height: '100%', background: 'var(--amber)', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div className="mono-dim" style={{ marginTop: 6, textAlign: 'right' }}>
              {latestScore ? `${latestScore.score} / ${goalScore}` : `0 / ${goalScore}`}
            </div>
          </div>
          {/* Sea swim pass/fail */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span className="mono-dim" style={{ fontSize: 10 }}>2KM SEA SWIM</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: swimPassed === null ? 'var(--text-faint)' : swimPassed ? 'var(--success)' : '#f87171',
              }}>
                {swimPassed === null ? 'NO ATTEMPT' : swimPassed ? 'PASS' : 'FAIL'}
              </span>
            </div>
            {swimLatest && (
              <div className="mono-dim" style={{ fontSize: 10 }}>
                {formatRunTime(swimLatest.timeSeconds)} · std {formatRunTime(SWIM_PASS_SECONDS)}
              </div>
            )}
          </div>
        </Panel>

        <Panel ticks style={{ padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span className="label">▲ STATION BREAKDOWN · LATEST</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm" onClick={() => { setForm(BLANK_FORM()); setShowModal(true); }}>LOG IPPT</button>
              <button className="btn ghost sm" onClick={() => { setSwimForm(BLANK_SWIM_FORM()); setShowSwimModal(true); }}>LOG SWIM</button>
            </div>
          </div>
          {stationRows.map((s) => (
            <div key={s.label} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span className="label">{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.val ?? '—'}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${s.pts != null ? (s.pts / s.max) * 100 : 0}%`, height: '100%', background: 'var(--amber)', borderRadius: 2 }} />
              </div>
              <div className="mono-dim" style={{ marginTop: 3 }}>
                {s.pts != null ? `${s.pts} / ${s.max} pts` : '—'}
              </div>
            </div>
          ))}
          {/* Sea swim station */}
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span className="label" style={{ fontSize: 10 }}>2KM SEA SWIM</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--accent-text)', fontVariantNumeric: 'tabular-nums' }}>
                {swimLatest ? formatRunTime(swimLatest.timeSeconds) : '—'}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: swimLatest ? `${Math.min(100, (SWIM_PASS_SECONDS / swimLatest.timeSeconds) * 80)}%` : '0%',
                height: '100%', background: swimPassed ? 'var(--success)' : 'var(--accent-text)', borderRadius: 2,
              }} />
            </div>
            <div className="mono-dim" style={{ fontSize: 10, marginTop: 3 }}>
              {swimPassed === null ? `NO ATTEMPT · STD ${formatRunTime(SWIM_PASS_SECONDS)}` : swimPassed ? 'PASS' : `FAIL · STD ${formatRunTime(SWIM_PASS_SECONDS)}`}
            </div>
          </div>
        </Panel>
      </div>

      {/* SCORE PROGRESSION */}
      <Panel ticks style={{ padding: 26, marginBottom: 16 }}>
        <span className="label" style={{ marginBottom: 16, display: 'block' }}>IPPT SCORE PROGRESSION</span>
        {chartSeries.length > 0 ? (
          <>
            <SvgLineChart
              data={chartSeries}
              accessor={(d) => d.v}
              yMax={100}
              yMin={0}
              height={200}
              goal={goalScore}
              goalLabel={`Goal: ${goalName} (${goalScore})`}
              color="var(--amber)"
              fmt={(v) => String(Math.round(v))}
              onDotClick={handleChartDotClick}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 28px 0' }}>
              {chartSeries.map((d) => (
                <span key={d.label} className="mono-dim" style={{ fontSize: 10 }}>{d.label}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="mono-dim" style={{ padding: '40px 0', textAlign: 'center' }}>
            No attempts logged yet. Log your first attempt to see your progression.
          </div>
        )}
      </Panel>

      {/* WEEKEND PLANNER CTA */}
      <Panel elevated style={{ padding: 24, marginBottom: 16, borderColor: 'var(--accent-line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>🗓</span>
          <div style={{ flex: 1 }}>
            <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 6 }}>▲ AI-CURATED TRAINING</div>
            <div className="h-title" style={{ fontSize: 17, marginBottom: 5 }}>Weekend Planner / Vocation-Based Training Plan</div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
              Personalised for your attempt history, PES {profile.pesStatus},{' '}
              {(profile.vocation || 'General').toUpperCase()} vocation, and {goalName} target.
            </p>
          </div>
          <button className="btn" style={{ flexShrink: 0, padding: '10px 18px' }} onClick={() => navigate('/weekend-planner')}>
            OPEN PLAN →
          </button>
        </div>
      </Panel>

      {/* ATTEMPT HISTORY */}
      <div ref={historyRef}>
        <Panel ticks style={{ padding: 26, marginBottom: 16 }}>
          <span className="label" style={{ marginBottom: 16, display: 'block' }}>▲ IPPT ATTEMPT HISTORY</span>
          {attempts.length > 0 ? (
            <>
              <div className="attempt-history-grid attempt-history-head">
                {['DATE', 'PUSH-UPS', 'SIT-UPS', '2.4KM', 'PTS', 'AWARD', ''].map((h) => (
                  <span key={h} className="label" style={{ fontSize: 10 }}>{h}</span>
                ))}
              </div>
              {[...attempts].reverse().map((attempt, reversedI) => {
                const sc          = calculateIpptScore(attempt.pushups, attempt.situps, attempt.runSeconds);
                const originalIdx = attempts.length - 1 - reversedI;
                const isHighlighted = highlightedAttempt === originalIdx;
                return (
                  <div key={reversedI} className={`attempt-history-grid${isHighlighted ? ' attempt-glow' : ''}`}>
                    <span className="mono-dim">{shortDate(attempt.date)}</span>
                    <span className="mono">{attempt.pushups}</span>
                    <span className="mono">{attempt.situps}</span>
                    <span className="mono">{formatRunTime(attempt.runSeconds)}</span>
                    <span className="mono" style={{ color: 'var(--amber)', fontWeight: 700 }}>{sc.score}</span>
                    <Award award={sc.award} />
                    <button
                      onClick={() => openEdit(originalIdx)}
                      title="Edit attempt"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, fontSize: 13, lineHeight: 1 }}
                    >
                      ✎
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="mono-dim" style={{ padding: '20px 0', textAlign: 'center' }}>No attempts logged yet.</div>
          )}
        </Panel>
      </div>

      {/* 2KM SEA SWIM HISTORY */}
      <Panel ticks style={{ padding: 26, marginBottom: 16 }}>
        <span className="label" style={{ marginBottom: 16, display: 'block' }}>▲ 2KM SEA SWIM · ATTEMPT HISTORY</span>
        {swimAttempts.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px 16px', marginBottom: 8 }}>
              {['DATE', 'TIME', 'RESULT', ''].map((h) => (
                <span key={h} className="label" style={{ fontSize: 10 }}>{h}</span>
              ))}
            </div>
            {[...swimAttempts].reverse().map((attempt, i) => {
              const passed = attempt.timeSeconds <= SWIM_PASS_SECONDS;
              const origIdx = swimAttempts.length - 1 - i;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px 16px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="mono-dim">{shortDate(attempt.date)}</span>
                  <span className="mono" style={{ color: 'var(--accent-text)' }}>{formatRunTime(attempt.timeSeconds)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: passed ? 'var(--success)' : '#f87171' }}>
                    {passed ? 'PASS' : 'FAIL'}
                  </span>
                  <button
                    onClick={() => openSwimEdit(origIdx)}
                    title="Edit"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, fontSize: 13 }}
                  >✎</button>
                </div>
              );
            })}
          </>
        ) : (
          <div className="mono-dim" style={{ padding: '20px 0', textAlign: 'center' }}>No sea swim attempts logged yet.</div>
        )}
      </Panel>

      {/* TRAINING FEED */}
      {feed.length > 0 && (
        <Panel ticks style={{ padding: 26, cursor: 'pointer' }} onClick={() => navigate('/training-feed')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="label">▲ TRAINING FEED · UNIT ACTIVITY</span>
            <span className="mono-dim" style={{ fontSize: 10 }}>VIEW ALL →</span>
          </div>
          {feed.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: 'var(--accent-text)' }}>▲</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 13 }}>{item.name}</span>
                  <span className="mono-dim" style={{ fontSize: 10 }}>{item.recency}</span>
                </div>
                <div style={{ marginBottom: 3 }}>
                  {(item.chips || []).map((c) => (
                    <span key={c} className="info-badge" style={{ marginRight: 4, fontSize: 10 }}>{c}</span>
                  ))}
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{item.detail}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--amber)' }}>{item.statline}</div>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {/* LOG SWIM MODAL */}
      {showSwimModal && (
        <Modal title="Log 2km Sea Swim" onClose={() => setShowSwimModal(false)}>
          <SwimAttemptForm
            form={swimForm}
            setForm={setSwimForm}
            stravaSwims={state.strava?.swims || []}
            stravaConnected={state.strava?.connected || false}
            onConnectStrava={() => { setShowSwimModal(false); navigate('/serve/strava-connect'); }}
          />
          <button className="primary-button" style={{ marginTop: 20, width: '100%' }} onClick={submitSwimAttempt}>
            SAVE ATTEMPT
          </button>
        </Modal>
      )}

      {/* EDIT SWIM MODAL */}
      {swimEditIdx !== null && swimEditForm && (
        <Modal title="Edit Sea Swim Attempt" onClose={() => { setSwimEditIdx(null); setSwimEditForm(null); }}>
          <SwimAttemptForm
            form={swimEditForm}
            setForm={setSwimEditForm}
            stravaSwims={state.strava?.swims || []}
            stravaConnected={state.strava?.connected || false}
            onConnectStrava={() => { setSwimEditIdx(null); setSwimEditForm(null); navigate('/serve/strava-connect'); }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="primary-button" style={{ flex: 1 }} onClick={saveSwimEdit}>SAVE CHANGES</button>
            <button
              onClick={() => deleteSwimAttempt(swimEditIdx)}
              style={{ padding: '10px 18px', background: 'none', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}
            >DELETE</button>
          </div>
        </Modal>
      )}

      {/* LOG ATTEMPT MODAL */}
      {showModal && (
        <Modal title="Log IPPT Attempt" onClose={() => setShowModal(false)}>
          <AttemptForm
            form={form}
            setForm={setForm}
            stravaActivities={state.strava?.activities || []}
            stravaConnected={state.strava?.connected || false}
            onConnectStrava={() => { setShowModal(false); navigate('/serve/strava-connect'); }}
          />
          <button className="primary-button" style={{ marginTop: 20, width: '100%' }} onClick={submitAttempt}>
            SAVE ATTEMPT
          </button>
        </Modal>
      )}

      {/* EDIT ATTEMPT MODAL */}
      {editIdx !== null && editForm && (
        <Modal title="Edit Attempt" onClose={() => { setEditIdx(null); setEditForm(null); }}>
          <AttemptForm
            form={editForm}
            setForm={setEditForm}
            stravaActivities={state.strava?.activities || []}
            stravaConnected={state.strava?.connected || false}
            onConnectStrava={() => { setEditIdx(null); setEditForm(null); navigate('/serve/strava-connect'); }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="primary-button" style={{ flex: 1 }} onClick={saveEdit}>SAVE CHANGES</button>
            <button
              onClick={() => deleteAttempt(editIdx)}
              style={{ padding: '10px 18px', background: 'none', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}
            >
              DELETE
            </button>
          </div>
        </Modal>
      )}

      {/* PERSONAL BEST CELEBRATION MODAL */}
      {pbModal && (
        <Modal title="New Personal Best 🏆" onClose={() => setPbModal(null)}>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 18 }}>
            You just broke your personal record. Share it with your unit on the Training Feed.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {pbModal.newPbs.map(({ exercise, value }) => (
              <div key={exercise} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 6, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)' }}>
                <span className="label" style={{ fontSize: 12, color: 'var(--accent-text)' }}>{exercise}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--amber)' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="primary-button"
              style={{ flex: 1 }}
              onClick={() => {
                setPbModal(null);
                navigate('/training-feed', { state: { autoCompose: true, attemptIdx: pbModal.newAttemptIdx } });
              }}
            >
              SHARE TO TRAINING FEED
            </button>
            <button
              onClick={() => setPbModal(null)}
              style={{ padding: '10px 18px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}
            >
              DISMISS
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TRAINING FEED ───────────────────────────────────────────────────────────

const FEELINGS = [
  { emoji: '🏆', label: 'Proud'     },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '😊', label: 'Happy'     },
  { emoji: '🔥', label: 'On Fire'   },
  { emoji: '🎯', label: 'Focused'   },
  { emoji: '😮‍💨', label: 'Relieved'  },
  { emoji: '😤', label: 'Exhausted' },
  { emoji: '😐', label: 'Neutral'   },
];

const REACTIONS = [
  { key: 'cheer',   emoji: '💪' },
  { key: 'fire',    emoji: '🔥' },
  { key: 'respect', emoji: '🫡' },
];

function FeedPostCard({ post, onReact, onAddReply, onDelete, isOwn }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [replyError, setReplyError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setSubmitting(true);
    const result = await nlpService.moderate(text);
    if (!result.approved) {
      setReplyError(result.reason || 'Please keep your comment kind and constructive.');
      setSubmitting(false);
      return;
    }
    onAddReply(post.id, text);
    setReplyText('');
    setReplyError('');
    setSubmitting(false);
  };

  return (
    <Panel ticks style={{ padding: 24 }}>
      {/* Author row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {(post.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{post.name}</div>
            <div className="mono-dim" style={{ fontSize: 11 }}>{post.unit} · {post.recency}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {post.statline && (
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24, color: 'var(--amber)', lineHeight: 1 }}>
              {post.statline}
            </div>
          )}
          {onDelete && isOwn && (
            <button
              onClick={() => onDelete(post.id, post._dbId)}
              title="Delete post"
              style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 15, lineHeight: 1, padding: '2px 4px' }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Strava attribution badge */}
      {post.source === 'strava' && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', background: '#FC4C02', padding: '3px 8px', borderRadius: 4 }}>
            ▲ STRAVA {post.activityType === 'swim' ? 'SWIM' : 'RUN'}
          </span>
        </div>
      )}

      {/* Chips */}
      {post.chips?.length > 0 && (
        <div className="badge-row" style={{ marginBottom: 10 }}>
          {post.chips.map((c) => <span key={c} className="info-badge">{c}</span>)}
        </div>
      )}

      {/* Title */}
      {post.title && (
        <div className="h-title" style={{ fontSize: 16, marginBottom: 8 }}>{post.title}</div>
      )}

      {/* Body */}
      {post.detail && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-line' }}>
          {post.detail}
        </p>
      )}

      {/* Photos */}
      {post.photos?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {post.photos.map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: 130, height: 96, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {/* Reactions + reply toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        {REACTIONS.map(({ key, emoji }) => {
          const count   = post.reactions?.[key] || 0;
          const active  = post.userReaction === key;
          return (
            <button key={key} onClick={() => onReact(post.id, key)} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 20,
              background: active ? 'var(--accent-soft)' : 'transparent',
              border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border)'}`,
              fontSize: 13, transition: 'all 0.15s',
            }}>
              <span>{emoji}</span>
              <span className="mono-dim" style={{ fontSize: 11 }}>{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => setRepliesOpen((v) => !v)}
          style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.06em' }}
        >
          {repliesOpen ? 'HIDE REPLIES' : `REPLIES (${post.comments?.length || 0})`}
        </button>
      </div>

      {/* Replies section */}
      {repliesOpen && (
        <div style={{ paddingTop: 14, marginTop: 12, borderTop: '1px solid var(--border)' }}>
          {(post.comments || []).map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: 12, color: 'var(--accent-text)', fontFamily: 'var(--font-head)', fontWeight: 800, flexShrink: 0 }}>
                {(c.author || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{c.author}</span>
                  <span className="mono-dim" style={{ fontSize: 10 }}>{c.recency}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5 }}>{c.text}</p>
              </div>
            </div>
          ))}
          {replyError && (
            <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'var(--font-mono)', margin: '0 0 8px' }}>{replyError}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setReplyError(''); }}
              placeholder="Add a reply…"
              style={{ flex: 1, fontSize: 13 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            />
            <button className="btn ghost sm" onClick={handleReply} disabled={submitting || !replyText.trim()}>
              {submitting ? '…' : 'POST'}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ComposePostModal({ profile, attempts, stravaActivities = [], stravaSwims = [], onClose, onSubmit, initialAttemptIdx }) {
  // Runs + swims as one selectable list, most recent first.
  const stravaItems = [...stravaActivities, ...stravaSwims].sort((a, b) => new Date(b.date) - new Date(a.date));
  const hasStrava = stravaItems.length > 0;
  // Default to whichever source the user actually has data for.
  const [source, setSource]             = useState(attempts.length === 0 && hasStrava ? 'strava' : 'ippt');
  const [selectedIdx, setSelectedIdx]   = useState(initialAttemptIdx ?? (attempts.length > 0 ? attempts.length - 1 : null));
  const [stravaIdx, setStravaIdx]       = useState(0);
  const [exercises, setExercises]       = useState({ pushups: true, situps: true, run: true });
  const [title, setTitle]               = useState('');
  const [body, setBody]                 = useState('');
  const [photos, setPhotos]             = useState([]);
  const [feeling, setFeeling]           = useState('');

  const attempt = selectedIdx !== null ? attempts[selectedIdx] : null;
  const sc = attempt ? calculateIpptScore(attempt.pushups, attempt.situps, attempt.runSeconds) : null;
  const stravaItem = source === 'strava' ? stravaItems[stravaIdx] : null;

  const toggleEx = (k) => setExercises((prev) => ({ ...prev, [k]: !prev[k] }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - photos.length);
    Promise.all(files.map((f) => new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target.result);
      reader.readAsDataURL(f);
    }))).then((urls) => setPhotos((prev) => [...prev, ...urls].slice(0, 3)));
  };

  const buildPost = () => {
    const base = {
      id: `user-${Date.now()}`,
      name: profile.fullName,
      unit: profile.unit || 'Unit',
      recency: 'Just now',
      photos,
      reactions: { cheer: 0, fire: 0, respect: 0 },
      userReaction: '',
      comments: [],
      isUserPost: true,
    };
    const feelingLine = feeling ? `Feeling: ${feeling}` : '';

    // Strava run/swim post — headline is the time; stats come from the activity.
    if (source === 'strava' && stravaItem) {
      const isSwim = stravaItem.type === 'swim';
      const paceStr = isSwim ? `${stravaItem.pacePer100m} /100m` : `${stravaItem.pacePerKm} /km`;
      const chips = [isSwim ? 'Swim' : 'Run', `${stravaItem.distanceKm} km`, paceStr];
      if (stravaItem.isRace) chips.push('Race');
      if (feeling) chips.push(feeling);
      const statsLine = `Distance: ${stravaItem.distanceKm} km · Time: ${stravaService.formatDuration(stravaItem.durationSeconds)} · Pace: ${paceStr}`;
      return {
        ...base,
        title: title.trim() || stravaItem.name,
        headline: title.trim() || stravaItem.name,
        statline: stravaService.formatDuration(stravaItem.durationSeconds),
        detail: [statsLine, feelingLine, body.trim()].filter(Boolean).join('\n\n'),
        chips,
        source: 'strava',
        activityType: isSwim ? 'swim' : 'run',
      };
    }

    // IPPT attempt post (original behaviour).
    const statLines = [];
    const chips = [];
    if (attempt) {
      if (exercises.pushups) { statLines.push(`Push-ups: ${attempt.pushups} reps`); chips.push('Push-ups'); }
      if (exercises.situps)  { statLines.push(`Sit-ups: ${attempt.situps} reps`);   chips.push('Sit-ups');  }
      if (exercises.run)     { statLines.push(`2.4km: ${formatRunTime(attempt.runSeconds)}`); chips.push('2.4km'); }
      if (sc) chips.push(sc.award);
    }
    if (feeling) chips.push(feeling);
    return {
      ...base,
      title: title.trim(),
      headline: title.trim() || 'Activity',
      statline: sc ? `${sc.score} pts` : '',
      detail: [statLines.join(' · '), feelingLine, body.trim()].filter(Boolean).join('\n\n'),
      chips,
    };
  };

  const canSubmit = source === 'strava' ? Boolean(stravaItem) : (title.trim() || body.trim());

  return (
    <Modal title="Post Activity" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Source toggle — only when the user has Strava runs to choose from */}
        {hasStrava && (
          <div className="post-source-toggle">
            <button type="button" className={`post-source-tab${source === 'ippt' ? ' active' : ''}`} onClick={() => setSource('ippt')}>
              IPPT ATTEMPT
            </button>
            <button type="button" className={`post-source-tab${source === 'strava' ? ' active strava' : ''}`} onClick={() => setSource('strava')}>
              STRAVA
            </button>
          </div>
        )}

        {/* Activity selector */}
        {source === 'strava' ? (
          <div>
            <div className="label" style={{ fontSize: 10, marginBottom: 8 }}>SELECT ACTIVITY</div>
            <select value={stravaIdx} onChange={(e) => setStravaIdx(Number(e.target.value))} style={{ width: '100%' }}>
              {stravaItems.map((it, i) => (
                <option key={`${it.type}-${it.stravaId}`} value={i}>
                  {it.type === 'swim' ? '🏊' : '🏃'} {stravaService.formatRunDate(it.date)} — {it.name} ({it.distanceKm} km)
                </option>
              ))}
            </select>
            {stravaItem && (
              <div className="badge-row" style={{ marginTop: 12 }}>
                <span className="info-badge">{stravaItem.distanceKm} km</span>
                <span className="info-badge">{stravaService.formatDuration(stravaItem.durationSeconds)}</span>
                <span className="info-badge">{stravaItem.type === 'swim' ? `${stravaItem.pacePer100m} /100m` : `${stravaItem.pacePerKm} /km`}</span>
                {stravaItem.isRace && <span className="info-badge">Race</span>}
              </div>
            )}
          </div>
        ) : attempts.length > 0 ? (
          <div>
            <div className="label" style={{ fontSize: 10, marginBottom: 8 }}>SELECT ATTEMPT</div>
            <select
              value={selectedIdx ?? ''}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              style={{ width: '100%' }}
            >
              {[...attempts].reverse().map((a, ri) => {
                const idx = attempts.length - 1 - ri;
                const s = calculateIpptScore(a.pushups, a.situps, a.runSeconds);
                return (
                  <option key={idx} value={idx}>
                    {shortDate(a.date)} — {s.score} pts ({s.award})
                  </option>
                );
              })}
            </select>
            {attempt && (
              <div style={{ marginTop: 12 }}>
                <div className="label" style={{ fontSize: 10, marginBottom: 8 }}>EXERCISES TO SHARE</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { key: 'pushups', label: `Push-ups · ${attempt.pushups}` },
                    { key: 'situps',  label: `Sit-ups · ${attempt.situps}` },
                    { key: 'run',     label: `2.4km · ${formatRunTime(attempt.runSeconds)}` },
                  ].map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => toggleEx(key)} style={{
                      padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                      background: exercises[key] ? 'var(--accent-soft)' : 'transparent',
                      border: `1px solid ${exercises[key] ? 'var(--accent-line)' : 'var(--border)'}`,
                      color: exercises[key] ? 'var(--accent-text)' : 'var(--text-dim)',
                      transition: 'all 0.15s',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mono-dim" style={{ fontSize: 13, margin: 0 }}>No IPPT attempts logged yet. Log an attempt first to share your stats.</p>
        )}

        {/* Title */}
        <div>
          <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>TITLE</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New PB — Gold run" style={{ width: '100%' }} />
        </div>

        {/* Notes */}
        <div>
          <div className="label" style={{ fontSize: 10, marginBottom: 6 }}>NOTES</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share how the session went…"
            rows={3}
            style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }}
          />
        </div>

        {/* Feeling */}
        <div>
          <div className="label" style={{ fontSize: 10, marginBottom: 10 }}>I'M FEELING</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {FEELINGS.map(({ emoji, label }) => {
              const active = feeling === `${emoji} ${label}`;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFeeling(active ? '' : `${emoji} ${label}`)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 5, padding: '10px 6px', borderRadius: 6, cursor: 'pointer',
                    background: active ? 'var(--accent-soft)' : 'var(--bg)',
                    border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: active ? 'var(--accent-text)' : 'var(--text-dim)', letterSpacing: '0.06em' }}>
                    {label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div>
          <div className="label" style={{ fontSize: 10, marginBottom: 8 }}>PHOTOS (up to 3)</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', cursor: photos.length < 3 ? 'pointer' : 'not-allowed', opacity: photos.length < 3 ? 1 : 0.4, letterSpacing: '0.05em' }}>
            📷 UPLOAD
            <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} disabled={photos.length >= 3} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {photos.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ width: 88, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, pi) => pi !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#2a2a2a', border: '1px solid var(--border)', color: '#aaa', cursor: 'pointer', fontSize: 11, display: 'grid', placeItems: 'center', padding: 0 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="primary-button" onClick={() => { if (canSubmit) onSubmit(buildPost()); }} style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          POST ACTIVITY
        </button>
      </div>
    </Modal>
  );
}

// Strava activity view inside the training feed. Read-only; pulls from app state.
// Shows runs and swims merged, most recent first.
function StravaFeed({ connected, activities, swims = [], onConnect }) {
  if (!connected) {
    return (
      <Panel ticks style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="#FC4C02" aria-hidden="true">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
        <h3 className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>Connect Strava to see your runs here</h3>
        <p className="mono-dim" style={{ fontSize: 12.5, marginBottom: 18 }}>
          Your synced runs and swims will appear alongside platoon activity.
        </p>
        <button className="btn" style={{ background: '#FC4C02', borderColor: '#FC4C02' }} onClick={onConnect}>
          CONNECT WITH STRAVA
        </button>
      </Panel>
    );
  }

  const merged = [...activities, ...swims].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!merged.length) {
    return (
      <div className="mono-dim" style={{ textAlign: 'center', padding: '48px 0' }}>
        No runs or swims found. Go train and sync again.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {merged.map((act) => {
        const isSwim = act.type === 'swim';
        return (
          <Panel key={`${act.type}-${act.stravaId}`} style={{ padding: '16px 20px', position: 'relative' }}>
            <span className="strava-badge">{isSwim ? '🏊 STRAVA' : '🏃 STRAVA'}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8, paddingRight: 86 }}>
              <span className="h-title" style={{ fontSize: 16 }}>{act.name}</span>
              <span className="mono-dim" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{stravaService.formatRunDate(act.date)}</span>
            </div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <StravaStat label="DISTANCE" value={`${act.distanceKm} km`} />
              <StravaStat label="DURATION" value={stravaService.formatDuration(act.durationSeconds)} />
              {isSwim
                ? <StravaStat label="PACE" value={`${act.pacePer100m} /100m`} />
                : <StravaStat label="PACE" value={`${act.pacePerKm} /km`} />}
              {act.isRace && <StravaStat label="TYPE" value="RACE" />}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function StravaStat({ label, value }) {
  return (
    <div>
      <div className="label" style={{ fontSize: 9, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#FC4C02', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function TrainingFeedScreen({ state, updateState, setStravaData }) {
  const profile   = state.auth.profile;
  const { user: authUser } = useAuth();
  const supabaseId = authUser?.supabaseId || profile?.supabaseId;
  const myPostIds  = useRef(new Set());
  const location  = useLocation();
  const navigate  = useNavigate();
  const [showCompose, setShowCompose] = useState(location.state?.autoCompose ?? false);
  const [autoAttemptIdx] = useState(location.state?.attemptIdx ?? null);
  const [feedTab, setFeedTab] = useState('platoon'); // 'platoon' | 'strava'
  const [syncing, setSyncing] = useState(false);

  const posts = state.social?.trainingFeedPosts ?? [];
  const stravaConnected = state.strava?.connected || false;
  const stravaActivities = state.strava?.activities || [];
  const stravaSwims = state.strava?.swims || [];

  const syncStrava = async () => {
    setSyncing(true);
    const { activities, swims, athlete, error } = await stravaService.getActivities();
    setSyncing(false);
    if (error) return; // keep existing data; safe no-op on failure
    setStravaData?.(activities, athlete, swims);
  };

  const react = (postId, key) => {
    updateState((c) => ({
      ...c,
      social: {
        ...c.social,
        trainingFeedPosts: c.social.trainingFeedPosts.map((p) => {
          if (p.id !== postId) return p;
          const was = p.userReaction === key;
          const r   = { ...p.reactions };
          if (p.userReaction) r[p.userReaction] = Math.max(0, (r[p.userReaction] || 0) - 1);
          if (!was) r[key] = (r[key] || 0) + 1;
          return { ...p, userReaction: was ? '' : key, reactions: r };
        }),
      },
    }));
  };

  const addReply = (postId, text) => {
    const post = (state.social?.trainingFeedPosts || []).find((p) => p.id === postId);
    dbService.saveFeedComment(post?._dbId || postId, supabaseId, profile.fullName, text);
    updateState((c) => ({
      ...c,
      social: {
        ...c.social,
        trainingFeedPosts: c.social.trainingFeedPosts.map((p) =>
          p.id !== postId ? p : {
            ...p,
            comments: [...(p.comments || []), { id: Date.now(), author: profile.fullName, text, recency: 'Just now' }],
          }
        ),
      },
    }));
  };

  const publishPost = async (post) => {
    const dbId = await dbService.saveFeedPost(supabaseId, post);
    const postWithDbId = dbId ? { ...post, _dbId: dbId, userId: supabaseId } : post;
    myPostIds.current.add(postWithDbId.id);
    updateState((c) => ({
      ...c,
      social: { ...c.social, trainingFeedPosts: [postWithDbId, ...c.social.trainingFeedPosts] },
    }));
    setShowCompose(false);
  };

  const deletePost = (postId, dbId) => {
    myPostIds.current.delete(postId);
    dbService.deleteFeedPost(dbId);
    updateState((c) => ({
      ...c,
      social: { ...c.social, trainingFeedPosts: c.social.trainingFeedPosts.filter((p) => p.id !== postId) },
    }));
  };

  const isMyPost = (post) => myPostIds.current.has(post.id) || (supabaseId && post.userId === supabaseId);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 8, display: 'block' }}>▲ SERVE · TRAINING FEED</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <h1 className="h-display" style={{ fontSize: 52, margin: 0 }}>TRAINING FEED</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {feedTab === 'strava' && stravaConnected && (
            <button
              className="btn ghost sm"
              onClick={syncStrava}
              disabled={syncing}
              style={{ borderColor: '#FC4C02', color: '#FC4C02' }}
              title="Re-sync your Strava runs"
            >
              {syncing ? 'SYNCING…' : '⟳ SYNC'}
            </button>
          )}
          <button className="btn" style={{ padding: '10px 20px' }} onClick={() => setShowCompose(true)}>
            + POST ACTIVITY
          </button>
        </div>
      </div>

      {/* Feed source tabs */}
      <div className="feed-tabs">
        <button
          className={`feed-tab${feedTab === 'platoon' ? ' active' : ''}`}
          onClick={() => setFeedTab('platoon')}
        >
          PLATOON
        </button>
        <button
          className={`feed-tab${feedTab === 'strava' ? ' active strava' : ''}`}
          onClick={() => setFeedTab('strava')}
        >
          STRAVA
        </button>
      </div>

      {feedTab === 'platoon' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.length === 0 && (
            <div className="mono-dim" style={{ textAlign: 'center', padding: '48px 0' }}>
              No activity posted yet. Be the first.
            </div>
          )}
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              onReact={react}
              onAddReply={addReply}
              isOwn={isMyPost(post)}
              onDelete={deletePost}
            />
          ))}
        </div>
      ) : (
        <StravaFeed
          connected={stravaConnected}
          activities={stravaActivities}
          swims={stravaSwims}
          onConnect={() => navigate('/serve/strava-connect')}
        />
      )}

      {showCompose && (
        <ComposePostModal
          profile={profile}
          attempts={state.ippt.attempts}
          stravaActivities={state.strava?.activities || []}
          stravaSwims={state.strava?.swims || []}
          initialAttemptIdx={autoAttemptIdx}
          onClose={() => setShowCompose(false)}
          onSubmit={publishPost}
        />
      )}
    </div>
  );
}

// ─── WEEKEND PLANNER ─────────────────────────────────────────────────────────
function WeekendPlannerScreen({ state, updateState, activeModule }) {
  const profile = state.auth.profile;
  const ipptAttempts = state.ippt.attempts;
  const swimAttempts = state.swim?.attempts || [];
  const stravaRuns = state.strava?.activities || [];
  const stravaSwimRuns = state.strava?.swims || [];

  const lastIpptDate = ipptAttempts.length ? ipptAttempts[ipptAttempts.length - 1].date : 'none';
  const lastSwimDate = swimAttempts.length ? swimAttempts[swimAttempts.length - 1].date : 'none';
  // Most recent run/swim id + counts fold Strava into the cache key, so a fresh
  // sync recalibrates the plan (and it re-uses the cache otherwise).
  const stravaKey = stravaRuns.length ? `${stravaRuns[0].stravaId}x${stravaRuns.length}` : 'none';
  const stravaSwimKey = stravaSwimRuns.length ? `${stravaSwimRuns[0].stravaId}x${stravaSwimRuns.length}` : 'none';
  const cacheKey = `${lastIpptDate}|${lastSwimDate}|${stravaKey}|${stravaSwimKey}`;

  const cachedPlan = state.workoutPlan?.cacheKey === cacheKey ? state.workoutPlan?.plan : null;
  const [plan, setPlan] = useState(cachedPlan);
  const [loading, setLoading] = useState(!cachedPlan);

  useEffect(() => {
    if (cachedPlan) return;

    const recentAttempts = ipptAttempts.slice(-3).map((a) => {
      const sc = calculateIpptScore(a.pushups, a.situps, a.runSeconds);
      return { score: sc.score, pushups: a.pushups, situps: a.situps, runTime: formatRunTime(a.runSeconds) };
    });
    const latestIppt = recentAttempts[recentAttempts.length - 1];
    const recentSwim = swimAttempts.slice(-3).map((a) => ({ time: formatRunTime(a.timeSeconds) }));
    // Last 5 synced runs/swims give the AI a live read on real-world volume.
    const recentRuns = stravaRuns.slice(0, 5).map((r) => ({
      name: r.name,
      distanceKm: r.distanceKm,
      time: stravaService.formatDuration(r.durationSeconds),
      pacePerKm: r.pacePerKm,
    }));
    const recentSwimRuns = stravaSwimRuns.slice(0, 5).map((s) => ({
      name: s.name,
      distanceKm: s.distanceKm,
      time: stravaService.formatDuration(s.durationSeconds),
      pacePer100m: s.pacePer100m,
    }));

    nlpService.getWeekendPlan({
      pesStatus: profile.pesStatus,
      vocation: profile.vocation || 'General',
      ipptGoal: state.onboarding.ipptGoal || 'Pass',
      currentScore: latestIppt?.score ?? null,
      currentAward: latestIppt?.score ? calculateIpptScore(
        ipptAttempts.slice(-1)[0].pushups,
        ipptAttempts.slice(-1)[0].situps,
        ipptAttempts.slice(-1)[0].runSeconds,
      ).award : null,
      attempts: recentAttempts,
      swimAttempts: recentSwim,
      stravaRuns: recentRuns,
      stravaSwims: recentSwimRuns,
    }).then((data) => {
      if (data) {
        setPlan(data);
        updateState((c) => ({ ...c, workoutPlan: { cacheKey, plan: data } }));
      }
      setLoading(false);
    });
  }, [cacheKey]);

  const PlanSection = ({ title, planData, color }) => {
    if (!planData) return null;
    return (
      <Panel ticks elevated style={{ padding: 26, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div className="label" style={{ color, marginBottom: 6 }}>▲ THIS WEEKEND · AI PLAN</div>
            <div className="h-title" style={{ fontSize: 20 }}>{title}</div>
          </div>
          <span className="info-badge">{(profile.vocation || 'General').toUpperCase()}</span>
        </div>
        <p style={{ color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.6 }}>{planData.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {planData.days.map((day) => (
            <Panel key={day.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="h-title" style={{ fontSize: 16 }}>{day.label}</span>
                <span className="mono-dim">{day.duration}</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{day.workout}</p>
            </Panel>
          ))}
        </div>
      </Panel>
    );
  };

  return (
    <section style={{ padding: '28px 36px' }}>
      <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 8, display: 'block' }}>▲ SERVE · WEEKEND PLANNER</span>
      <h1 className="h-display" style={{ fontSize: 52, marginBottom: 6 }}>WEEKEND PLANNER</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 20, fontSize: 14 }}>
        AI-curated weekend block covering IPPT and your 2km sea swim — personalised to your latest attempts.
      </p>
      <div className="badge-row" style={{ marginBottom: 20 }}>
        <span className="info-badge">PES {profile.pesStatus}</span>
        <span className="info-badge">{(profile.vocation || 'General').toUpperCase()}</span>
        <span className="info-badge">{state.onboarding.ipptGoal}</span>
        {loading && <span className="info-badge" style={{ color: 'var(--accent-text)' }}>◈ Generating…</span>}
        {!loading && cachedPlan && <span className="info-badge" style={{ color: 'var(--success)' }}>◈ Saved plan</span>}
      </div>

      {loading && !plan && (
        <div className="mono-dim" style={{ textAlign: 'center', padding: '60px 0' }}>Generating your personalised plan…</div>
      )}

      <PlanSection title="IPPT TRAINING PLAN" planData={plan?.ippt} color="var(--amber)" />
      <PlanSection title="2KM SEA SWIM PLAN" planData={plan?.swim} color="var(--accent-text)" />
    </section>
  );
}

function JournalScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [crisisState, setCrisisState] = useState(false);
  const [dismissedDip, setDismissedDip] = useState(false);
  const [trendInfo, setTrendInfo] = useState(null);
  const [expandedReflectionId, setExpandedReflectionId] = useState(null);

  // AI trend narrative: recomputed whenever the recent scores change (e.g. a new
  // entry is submitted). Needs at least 3 entries — otherwise we show nothing.
  const recentScores = state.journal.entries.slice(-7).map(entryScore);
  const scoreKey = recentScores.join(',');
  useEffect(() => {
    if (!state.onboarding.consented || recentScores.length < 3) {
      setTrendInfo(null);
      return undefined;
    }
    let active = true;
    nlpService.trendNarrative(recentScores).then((res) => {
      if (active) setTrendInfo(res);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreKey, state.onboarding.consented]);

  const prompt = wellnessPrompts[getToday().getDate() % wellnessPrompts.length];
  const entries = state.journal.entries.slice(-14);
  const allReflections = [...state.journal.entries].reverse();
  const streakDays = getJournalStreak(state.journal.entries);
  const dipState = isTrendDeclining(entries);

  // PDPA gate — consent is enforced upstream, but Sentinel refuses to run without it.
  if (!state.onboarding.consented) {
    return (
      <section>
        <ScreenHeader
          title="Sentinel"
          subtitle="Private reflection with NLP used only to estimate your own emotional trend."
        />
        <div className="alert-card">
          <h2>Consent needed</h2>
          <p>
            Sentinel only runs after you've reviewed and accepted the PDPA consent for private journaling.
            Your reflections are stored on your device and never shared with commanders.
          </p>
          <button className="primary-button" onClick={() => navigate('/setup/consent')}>
            Review consent
          </button>
        </div>
      </section>
    );
  }

  const submitEntry = async () => {
    if (!entry.trim()) return;
    setSaving(true);

    const result = await nlpService.analyze(entry.trim());

    if (result.crisis) {
      setCrisisState(true);
      setSaving(false);
      return;
    }

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      text: entry.trim(),
      sentiment: result,
      prompt,
    };

    dbService.saveJournalEntry(state.auth.profile?.supabaseId, newEntry);

    updateState((current) => ({
      ...current,
      journal: {
        ...current.journal,
        entries: [...current.journal.entries, newEntry],
      },
    }));

    setEntry('');
    setSaving(false);
  };

  const scoreSeries = entries.map((item) => Math.round(entryScore(item) * 100));
  const latestScore = scoreSeries.length ? scoreSeries[scoreSeries.length - 1] : null;
  const svgScores = entries.map((item) => ({ v: entryScore(item) }));
  const declining = dipState;
  const sentinelEnabled = state.settings?.sentinelEnabled ?? state.onboarding.journalOptIn ?? true;

  if (!sentinelEnabled) {
    return (
      <section>
        <ScreenHeader
          title="Sentinel"
          subtitle="Private reflection with NLP used only to estimate your own emotional trend."
        />
        <div className="alert-card">
          <h2>Sentinel is off</h2>
          <p>
            Your private journal and trend graph are disabled. You can turn Sentinel back on from your service record without restarting onboarding.
          </p>
          <button className="primary-button" onClick={() => navigate('/profile')}>
            Open service record
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="sentinel-page">
      <ScreenHeader
        title="Sentinel"
        subtitle="A private place to pause and write."
      />
      <div className="sentinel-privacy">
        <span aria-hidden="true">◌</span>
        <p><strong>Your journal is private.</strong> It is not shared with commanders or peers.</p>
      </div>
      <StreakCalendar entries={state.journal.entries} streakDays={streakDays} />

      <div className="sentinel-reflection-grid">
        <section className="sentinel-card sentinel-composer">
          <span className="sentinel-section-label">Tonight’s reflection</span>
          <h2>{prompt}</h2>
          <p className="sentinel-gentle-copy">Write whatever feels useful tonight.</p>
          <textarea
            className="journal-textarea"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write freely. Only you can see this."
          />
          <div className="sentinel-composer-footer">
            <span>Private on your device · {entry.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button className="sentinel-save-button" disabled={saving || !entry.trim()} onClick={submitEntry}>
              {saving ? 'Saving…' : 'Save reflection'}
            </button>
          </div>
        </section>

        <section className="sentinel-card sentinel-trend">
          <div className="sentinel-card-heading">
            <div>
              <span className="sentinel-section-label">Reflection trend</span>
              <h2>How you’ve been feeling</h2>
            </div>
            <span className={`sentinel-trend-state ${declining ? 'low' : 'steady'}`}>
              {declining ? 'Recent entries feel heavier' : 'Recent entries look steady'}
            </span>
          </div>
          <SvgLineChart
            data={svgScores}
            accessor={(d) => d.v}
            yMax={1} yMin={0}
            height={200}
            color={declining ? '#bd8068' : 'var(--sentinel-accent)'}
            gridColor="rgba(255,255,255,0.07)"
            textColor="var(--sentinel-copy)"
            fmt={(v) => v.toFixed(1)}
          />
          <p className="sentinel-chart-copy">
            {trendInfo ? trendInfo.narrative : 'Self-awareness is the mechanism. Only you ever see this graph.'}
          </p>
          {declining && !dismissedDip && (
            <button className="sentinel-secondary-button" onClick={() => navigate('/escalation')}>
              Review support options
            </button>
          )}
          {declining && !dismissedDip && (
            <button className="sentinel-text-button" onClick={() => setDismissedDip(true)}>
              I’m okay for now
            </button>
          )}
        </section>
      </div>

      <div className="sentinel-support-grid">
        <section className="sentinel-card sentinel-explainer">
          <span className="sentinel-section-label">Your choices</span>
          <h2>Support stays in your control</h2>
          {[
            ['When entries feel heavier', 'You can review support options whenever you choose.'],
            ['Nothing is shared automatically', 'Commanders and superiors are not notified.'],
            ['If you may be in immediate danger', 'Confidential crisis resources appear without sharing your reflection.'],
          ].map(([title, description]) => (
            <div key={title} className="sentinel-explainer-row">
              <span aria-hidden="true">•</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="sentinel-card sentinel-resources">
          <span className="sentinel-section-label">Support resources</span>
          <h2>Confidential help is always available</h2>
          <div className="sentinel-resource-list">
            {[
              ['SAF COUNSELLING CENTRE', 'Direct counsellor pathway', 'BOOK'],
              ['SAF COUNSELLING CARELINE', '24-hour', '1800 278 0022'],
              ['IMH MENTAL HEALTH HELPLINE', '24-hour', '6389 2222'],
              ['SAMARITANS OF SINGAPORE', 'SOS · 24-hour', '1767'],
            ].map(([t, sub, n]) => (
              <div key={t} className="sentinel-resource-row">
                <div>
                  <strong>{t}</strong>
                  <span>{sub}</span>
                </div>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="sentinel-past-section">
        <div className="sentinel-past-heading">
          <span className="sentinel-section-label">Past reflections</span>
          <p>A private record of the moments you chose to check in.</p>
        </div>
        <div className="sentinel-past-list">
        {allReflections.length === 0 ? (
          <div className="empty-state">No reflections yet. Your first entry will appear here.</div>
        ) : allReflections.map((item, index) => {
          const score = entryScore(item);
          const rowId = item.id ?? `${entryDay(item)}-${index}`;
          const isExpanded = expandedReflectionId === rowId;
          return (
            <article
              key={rowId}
              className={`sentinel-entry-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedReflectionId(isExpanded ? null : rowId)}
            >
              <div className="sentinel-entry-summary">
                <time>{shortDate(entryDay(item))}</time>
                <span className={`sentinel-entry-tone ${score < 0.5 ? 'low' : 'steady'}`} aria-label="Reflection tone" />
                <p>{item.text}</p>
                <span>{isExpanded ? 'Close' : 'Read'}</span>
              </div>
              {isExpanded && (
                <div className="reflection-expanded">
                  {item.prompt && <span>Prompt · {item.prompt}</span>}
                  <p>{item.text}</p>
                </div>
              )}
            </article>
          );
        })}
        </div>
      </section>

      {crisisState && (
        <div className="overlay-bg">
          <Panel elevated className="modal-card" style={{ borderColor: 'rgba(192,57,43,0.4)' }}>
            <span className="label" style={{ color: '#d96055', marginBottom: 10 }}>IMMEDIATE SUPPORT</span>
            <h2 className="h-title" style={{ fontSize: 32, marginBottom: 14 }}>YOU DON'T HAVE TO CARRY THIS ALONE.</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 24 }}>
              What you wrote matters. These lines are confidential and reach people trained to help right now.{' '}
              <strong style={{ color: 'var(--text)' }}>No commander is notified.</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {(crisisResources.resources || []).map((r) => (
                <div key={r.name} className="crisis-resource-row">
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, letterSpacing: '0.03em' }}>{r.name}</span>
                  <span className="mono" style={{ color: 'var(--amber)', fontSize: 18 }}>{r.number}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button className="primary-button" onClick={() => { setCrisisState(false); navigate('/escalation?crisis=true'); }}>
                SEE YOUR SUPPORT OPTIONS →
              </button>
              <button className="btn neutral full" onClick={() => setCrisisState(false)}>I'VE SEEN THIS → CLOSE</button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}


function EscalationScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [activePanel, setActivePanel] = useState(null);
  const [peerSent, setPeerSent] = useState(false);
  const [pslDraft, setPslDraft] = useState('');
  const [pslError, setPslError] = useState('');
  const [pslSending, setPslSending] = useState(false);

  // AI companion chat (multi-turn within the session).
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const entries = state.journal.entries.slice(-7);
  const latestThread = [...(state.support?.pslThreads || [])].reverse().find((thread) =>
    thread.status !== 'closed' && thread.requesterId === state.auth.profile?.memberId
  );
  const chartData = {
    labels: entries.map((item) => shortDate(entryDay(item))),
    datasets: [
      {
        data: entries.map((item) => Math.round(entryScore(item) * 100)),
        borderColor: '#4A7C59',
        backgroundColor: 'rgba(74, 124, 89, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#4A7C59',
        pointBorderColor: '#fffdf8',
        pointBorderWidth: 1.5,
      },
    ],
  };

  const sendToCompanion = async () => {
    if (!draft.trim() || thinking) return;
    const userText = draft.trim();
    const nextHistory = [...history, { role: 'user', content: userText }];
    setHistory(nextHistory);
    setDraft('');
    setThinking(true);
    const { reply } = await nlpService.companion(userText, history);
    setThinking(false);
    setHistory([...nextHistory, { role: 'assistant', content: reply }]);
  };

  const openPslThread = () => {
    const profile = state.auth.profile;
    const createdAt = new Date().toISOString();
    updateState((current) => ({
      ...current,
      support: {
        ...current.support,
        pslThreads: [
          ...(current.support?.pslThreads || []),
          {
            id: `psl-${Date.now()}`,
            alias: 'Anonymous NSF',
            subject: 'Peer support request',
            status: 'open',
            createdAt,
            assignedTo: peerSupportLead?.name || 'Amirul Hassan',
            requesterId: profile?.memberId,
            messages: [
              {
                from: 'anonymous',
                text: 'I would like to speak to a peer support leader anonymously.',
                timestamp: createdAt,
              },
            ],
          },
        ],
      },
    }));
    setPeerSent(true);
  };

  const sendPslMessage = async () => {
    if (!pslDraft.trim() || !latestThread) return;
    const text = pslDraft.trim();
    setPslSending(true);
    setPslError('');
    const verdict = await moderateSupportMessage(text);
    setPslSending(false);
    if (!verdict.approved) {
      setPslError(verdict.reason || 'This anonymous chat is for support. Rephrase it with care before sending.');
      return;
    }
    setPslDraft('');
    updateState((current) => ({
      ...current,
      support: {
        ...current.support,
        pslThreads: (current.support?.pslThreads || []).map((thread) =>
          thread.id === latestThread.id
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  { from: 'anonymous', text, timestamp: new Date().toISOString() },
                ],
              }
            : thread,
        ),
      },
    }));
  };

  return (
    <section>
      <ScreenHeader
        title="Your support options"
        subtitle="No commander is notified. You decide, every time."
      />

      <div className="chart-card sentinel-chart-card">
        <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 6 }}>◈ SENTINEL · WELLNESS TREND</div>
        <div className="chart-caption">Your private journal entries from the last 7 days, scored out of 100 by Sentinel. Only you can see this.</div>
        <div className="sentinel-chart-canvas">
          <Line options={chartOptions({ yLabel: true, yTicks: true, min: 0, max: 100 })} data={chartData} />
        </div>
      </div>

      <div className="escalation-options">
        <article className={`escalation-option ${activePanel === 'companion' ? 'active' : ''}`}>
          <h3>AI journalling companion</h3>
          <p>Talk it through with a warm, non-judgmental companion. Private to you.</p>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: -6, marginBottom: 4 }}>This is a supportive tool, not a substitute for professional therapy or clinical care.</p>
          <button className="soft-button" onClick={() => setActivePanel(activePanel === 'companion' ? null : 'companion')}>
            {activePanel === 'companion' ? 'Hide' : 'Open companion'}
          </button>
          {activePanel === 'companion' && (
            <div className="companion-panel">
              <div className="companion-thread">
                {history.length === 0 && !thinking && (
                  <p className="companion-hint">Share whatever's on your mind. There's no wrong way to start.</p>
                )}
                {history.slice(-20).map((message, index) => (
                  <div key={index} className={`companion-bubble ${message.role}`}>
                    {message.content}
                  </div>
                ))}
                {thinking && <div className="companion-bubble assistant">…</div>}
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write to your companion…"
                rows={3}
              />
              <div className="companion-actions">
                <button className="primary-button small" onClick={sendToCompanion} disabled={thinking}>
                  {thinking ? 'Reflecting…' : 'Send'}
                </button>
                {history.length > 0 && (
                  <button
                    className="soft-button"
                    onClick={() => {
                      setHistory([]);
                      setDraft('');
                    }}
                  >
                    Start over
                  </button>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="escalation-option">
          <h3>Peer support leader</h3>
          <p>Open an anonymous chat with your unit's trained peer supporter. No names shared.</p>
          <button className="soft-button" onClick={openPslThread} disabled={!!latestThread}>
            {latestThread ? 'Thread open' : 'Request anonymously'}
          </button>
          {latestThread && (
            <div className="psl-chat-card user-view">
              <div className="label" style={{ marginBottom: 8 }}>ANONYMOUS PSL THREAD</div>
              <div className="psl-chat-log">
                {latestThread.messages.map((message, index) => (
                  <div key={`${message.timestamp}-${index}`} className={`psl-chat-message ${message.from}`}>
                    <div className={`psl-chat-bubble ${message.from}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="psl-chat-compose">
                <input
                  value={pslDraft}
                  onChange={(event) => setPslDraft(event.target.value)}
                  placeholder="Add an anonymous message"
                />
                <button className="primary-button small" onClick={sendPslMessage} disabled={!pslDraft.trim() || pslSending}>
                  {pslSending ? 'Checking…' : 'Send'}
                </button>
              </div>
              {pslError && <p className="inline-warning">{pslError}</p>}
            </div>
          )}
        </article>

        <article className="escalation-option">
          <h3>SAF counselling &amp; crisis lines</h3>
          <p>Confidential and free. No commander is notified.</p>
          {crisisResources.resources.map((r) => (
            <div key={r.name} className="contact-card">
              <div>
                <strong>{r.name}</strong>
                {r.hours && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{r.hours}</div>}
              </div>
              <a href={`tel:${r.number}`}>{r.number}</a>
            </div>
          ))}
        </article>

        <article className="escalation-option">
          <h3>I'm okay for now</h3>
          <p>Head back to your journal. This stays here if you need it later.</p>
          <button className="soft-button" onClick={() => navigate('/journal')}>
            Back to journal
          </button>
        </article>
      </div>

      {peerSent && (
        <Modal title="Request sent" onClose={() => setPeerSent(false)}>
          <p>
            An anonymous chat thread has been opened for your unit's peer support leader. Your identity is not attached.
          </p>
          <button className="primary-button" onClick={() => setPeerSent(false)}>
            Close
          </button>
        </Modal>
      )}

    </section>
  );
}

function SupportConsoleScreen({ state, updateState }) {
  const profile = state.auth.profile;
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [replyChecking, setReplyChecking] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const threads = state.support?.pslThreads || [];
  const isSupportUser = profile?.role === 'peer-support';

  const sendReply = async (threadId) => {
    const text = (replyDrafts[threadId] || '').trim();
    if (!text) return;
    setReplyChecking((current) => ({ ...current, [threadId]: true }));
    setReplyErrors((current) => ({ ...current, [threadId]: '' }));
    const verdict = await moderateSupportMessage(text);
    setReplyChecking((current) => ({ ...current, [threadId]: false }));
    if (!verdict.approved) {
      setReplyErrors((current) => ({
        ...current,
        [threadId]: verdict.reason || 'PSL replies must stay kind, calm, and supportive. Rephrase before sending.',
      }));
      return;
    }
    updateState((current) => ({
      ...current,
      support: {
        ...current.support,
        pslThreads: (current.support?.pslThreads || []).map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  { from: 'psl', text, timestamp: new Date().toISOString() },
                ],
              }
            : thread,
        ),
      },
    }));
    setReplyDrafts((current) => ({ ...current, [threadId]: '' }));
  };

  const unsendMessage = (threadId, messageIndex) => {
    updateState((current) => ({
      ...current,
      support: {
        ...current.support,
        pslThreads: (current.support?.pslThreads || []).map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: thread.messages.filter((_, index) => index !== messageIndex),
              }
            : thread,
        ),
      },
    }));
    setSelectedMessage(null);
  };

  const setThreadStatus = (threadId, status) => {
    updateState((current) => ({
      ...current,
      support: {
        ...current.support,
        pslThreads: (current.support?.pslThreads || []).map((thread) =>
          thread.id === threadId ? { ...thread, status } : thread,
        ),
      },
    }));
  };

  if (!isSupportUser) {
    return (
      <section>
        <ScreenHeader title="Support Console" subtitle="Peer support leader access only." />
        <div className="empty-state">This console is available from the peer support leader account.</div>
      </section>
    );
  }

  return (
    <section>
      <ScreenHeader
        title="PSL Console"
        subtitle="Anonymous support threads only. Identities and personal training records stay hidden."
      />

      <div className="support-console-grid support-console-single">
        <Panel ticks style={{ padding: 22 }}>
          <span className="label" style={{ marginBottom: 14 }}>▲ ANONYMOUS PSL INBOX</span>
          <div className="support-thread-list">
            {threads.length === 0 ? (
              <div className="empty-state">No anonymous support threads yet.</div>
            ) : (
              [...threads].reverse().map((thread) => (
                <article key={thread.id} className="support-thread-card">
                  <div className="support-thread-top">
                    <div>
                      <div className="h-title" style={{ fontSize: 17 }}>{thread.alias}</div>
                      <div className="mono-dim">{thread.subject} · {shortDate(thread.createdAt)}</div>
                    </div>
                    <span className={`info-badge ${thread.status === 'open' ? 'distress-badge' : ''}`}>
                      {thread.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="psl-chat-log">
                    {thread.messages.map((message, index) => (
                      <div
                        key={`${thread.id}-${index}`}
                        className={`psl-chat-message ${message.from} ${selectedMessage?.threadId === thread.id && selectedMessage?.index === index ? 'selected' : ''}`}
                      >
                        <button
                          type="button"
                          className={`psl-chat-bubble ${message.from}`}
                          onClick={() => {
                            if (message.from !== 'psl') return;
                            setSelectedMessage((current) =>
                              current?.threadId === thread.id && current?.index === index
                                ? null
                                : { threadId: thread.id, index },
                            );
                          }}
                        >
                          {message.text}
                        </button>
                        {message.from === 'psl' && selectedMessage?.threadId === thread.id && selectedMessage?.index === index && (
                          <button className="psl-unsend-btn" type="button" onClick={() => unsendMessage(thread.id, index)}>
                            Unsend
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="psl-chat-compose">
                    <input
                      value={replyDrafts[thread.id] || ''}
                      onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                      placeholder="Reply as peer support leader"
                    />
                    <button className="primary-button small" onClick={() => sendReply(thread.id)} disabled={!replyDrafts[thread.id]?.trim() || replyChecking[thread.id]}>
                      {replyChecking[thread.id] ? 'Checking…' : 'Reply'}
                    </button>
                    <button className="soft-button" onClick={() => setThreadStatus(thread.id, thread.status === 'open' ? 'monitoring' : 'open')}>
                      {thread.status === 'open' ? 'Mark monitoring' : 'Reopen'}
                    </button>
                  </div>
                  {replyErrors[thread.id] && <p className="inline-warning">{replyErrors[thread.id]}</p>}
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel style={{ padding: 22 }}>
          <span className="label" style={{ marginBottom: 8 }}>▲ ACCESS CONTEXT</span>
          <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.55 }}>
            Signed in as {profile.rank} {profile.fullName}. Anonymous chats do not reveal who reached out.
          </p>
        </Panel>
      </div>
    </section>
  );
}

function ProfileScreen({ state, updateState, activeModule }) {
  const profile = state.auth.profile;
  const navigate = useNavigate();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);

  const [platoonFeed, setPlatoonFeed] = useState(true);
  const [eveningReminder, setEveningReminder] = useState(state.settings?.eveningReminder ?? true);

  const branch = state.ui?.branch || 'army';
  const goalName = state.onboarding.ipptGoal || 'Pass';

  const ipptAttempts = state.ippt.attempts;
  const latestIppt = ipptAttempts.length ? ipptAttempts[ipptAttempts.length - 1] : null;
  const latestScore = latestIppt
    ? calculateIpptScore(latestIppt.pushups, latestIppt.situps, latestIppt.runSeconds).score
    : null;
  const bestRunSeconds = ipptAttempts.length
    ? Math.min(...ipptAttempts.map((a) => a.runSeconds))
    : null;
  const journalStreak = getJournalStreak(state.journal.entries);

  const achievements = useMemo(() => {
    const list = [];
    if ((state.community?.buddyTaps || []).length > 0)
      list.push({ key: 'buddy', name: 'BROTHER IN ARMS', tier: 'bronze', desc: 'Tapped a buddy who needed cover' });
    if (journalStreak >= 30)
      list.push({ key: 'streak-30', name: 'IRON ROUTINE', tier: 'gold', desc: '30-night journal streak' });
    else if (journalStreak >= 12)
      list.push({ key: 'streak-12', name: 'DISCIPLINE · 12', tier: 'silver', desc: '12-night journal streak' });
    else if (journalStreak >= 7)
      list.push({ key: 'streak-7', name: 'DISCIPLINE · 7', tier: 'bronze', desc: '7-night journal streak' });
    if (ipptAttempts.find((a) => a.runSeconds < 600))
      list.push({ key: 'pb-run', name: 'SUB-10 RUNNER', tier: 'gold', desc: '2.4km run under 10:00' });
    if (ipptAttempts.some((a) => calculateIpptScore(a.pushups, a.situps, a.runSeconds).score >= 85))
      list.push({ key: 'gold-std', name: 'GOLD STANDARD', tier: 'gold', desc: 'Achieved a Gold IPPT award' });
    else if (ipptAttempts.some((a) => calculateIpptScore(a.pushups, a.situps, a.runSeconds).score >= 75))
      list.push({ key: 'silver-std', name: 'SILVER STANDARD', tier: 'silver', desc: 'Hit a Silver IPPT award' });
    return list;
  }, [ipptAttempts, journalStreak, state.community?.buddyTaps]);

  const signOut = () => {
    updateState((current) => ({
      ...current,
      auth: { isAuthenticated: false, profile: null },
    }));
    navigate('/login');
  };

  const setGoal = (key) =>
    updateState((c) => ({ ...c, onboarding: { ...c.onboarding, ipptGoal: key } }));
  const setBranch = (b) =>
    updateState((c) => ({ ...c, ui: { ...c.ui, branch: b } }));
  const setModule = (module) => {
    updateState((c) => ({ ...c, ui: { ...c.ui, activeModule: module } }));
    navigate(`/${module}`);
  };
  const toggleSentinel = () =>
    updateState((c) => ({ ...c, settings: { ...c.settings, sentinelEnabled: !(c.settings?.sentinelEnabled ?? true) } }));
  const toggleEveningReminder = () => {
    setEveningReminder((v) => !v);
    updateState((c) => ({ ...c, settings: { ...c.settings, eveningReminder: !(c.settings?.eveningReminder ?? eveningReminder) } }));
  };

  const GOAL_TIERS = [
    { key: 'Pass', label: 'PASS', range: '51 - 60', award: '$0' },
    { key: 'Pass with Incentive', label: 'PASS + INCENTIVE', range: '61 - 74', award: '$200' },
    { key: 'Silver', label: 'SILVER', range: '75 - 84', award: '$300' },
    { key: 'Gold', label: 'GOLD', range: '≥ 85', award: '$500' },
  ];

  const BRANCH_LIST = [
    { key: 'army', label: 'LAND', desc: 'Army' },
    { key: 'navy', label: 'NAVY', desc: 'Navy' },
    { key: 'air', label: 'AIR FORCE', desc: 'Air Force' },
    { key: 'dis', label: 'DIGITAL', desc: 'Digital Service' },
  ];

  const BRANCH_FORCE_LABEL = { army: 'LAND', navy: 'NAVY', air: 'AIR FORCE', dis: 'DIGITAL' };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* Identity panel */}
        <Panel elevated ticks style={{ padding: 30, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--accent-soft)', flexShrink: 0,
            border: '1px solid var(--accent-line)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center' }}>
            <Insignia branch={branch} size={40} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 32, lineHeight: 1 }}>
              {profile.fullName.toUpperCase()}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-dim)' }}>
              PES {profile.pesStatus} · {(profile.vocation || 'Infantry').toUpperCase()} · {profile.unit || '—'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <span className="badge verified">{BRANCH_FORCE_LABEL[branch]}</span>
            <span className="badge" style={{ background: 'var(--amber)', color: '#0A0A0A' }}>
              {goalName.toUpperCase()} TARGET
            </span>
          </div>
        </Panel>

        {/* Stats row */}
        <Panel flush style={{ padding: '22px 30px', marginBottom: 14, display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          <Stat label="DAYS TO ORD" value={ordDays} size={28} />
          <Stat label="LATEST IPPT" value={latestScore ?? '—'} unit={latestScore != null ? 'PTS' : undefined} size={28} />
          <Stat label="2.4KM PB" value={bestRunSeconds != null ? formatRunTime(bestRunSeconds) : '—'} size={28} />
          <Stat label="JOURNAL STREAK" value={journalStreak} unit="D" size={28} />
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>

          {/* Preferences panel */}
          <Panel style={{ padding: 28 }}>
            <span className="label" style={{ marginBottom: 18, display: 'block' }}>▲ IPPT OBJECTIVE</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(124px,1fr))', gap: 8 }}>
              {GOAL_TIERS.map((t) => {
                const active = goalName === t.key;
                return (
                  <button key={t.key} onClick={() => setGoal(t.key)}
                    style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 8,
                      border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border-strong)'}`,
                      background: active ? 'var(--accent-soft)' : 'var(--bg)' }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                      color: active ? 'var(--text)' : 'var(--text-dim)' }}>{t.label}</span>
                    <span className="mono" style={{ fontSize: 12, color: active ? 'var(--amber)' : 'var(--text-faint)', textAlign: 'center' }}>
                      {t.range} PTS · {t.award}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

            <span className="label" style={{ marginBottom: 12, display: 'block' }}>▲ JOURNEY MODE</span>
            <div className="module-mode-slider" role="tablist" aria-label="Journey mode">
              {[
                { key: 'enlist', label: 'ENLIST', desc: 'Before BMT' },
                { key: 'serve', label: 'SERVE', desc: 'Active service' },
              ].map((item) => {
                const active = activeModule === item.key;
                return (
                  <button key={item.key} className={active ? 'active' : ''} onClick={() => setModule(item.key)} type="button">
                    <span>{item.label}</span>
                    <small>{item.desc}</small>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

            <span className="label" style={{ marginBottom: 12, display: 'block' }}>▲ SERVICE THEME</span>
            <div className="record-branch-grid">
              {BRANCH_LIST.map((item) => {
                const active = branch === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={active ? 'active' : ''}
                    onClick={() => setBranch(item.key)}
                    data-branch={item.key}
                  >
                    <span className="record-branch-icon">
                      <Insignia branch={item.key} size={24} />
                    </span>
                    <span className="record-branch-label">{item.label}</span>
                    <small>{item.desc}</small>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

            <span className="label" style={{ marginBottom: 18, display: 'block' }}>PRIVACY & WELLNESS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <SettingRow
                title="Sentinel journal"
                desc="Nightly wellness tracking, visible only to you"
                on={state.settings?.sentinelEnabled ?? true}
                onToggle={toggleSentinel}
              />
              <SettingRow
                title="Platoon feed visibility"
                desc="Share your training activity with your section"
                on={platoonFeed}
                onToggle={() => setPlatoonFeed((v) => !v)}
              />
              <SettingRow
                title="Evening reminder"
                desc="Quiet 2100h nudge to journal"
                on={eveningReminder}
                onToggle={toggleEveningReminder}
              />
            </div>
          </Panel>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Panel style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span className="label">▲ RECENT AWARDS</span>
                {achievements.length > 3 && <span className="mono-dim" style={{ fontSize: 11 }}>LATEST 3</span>}
              </div>
              {achievements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {achievements.slice(0, 3).map((a) => (
                    <div key={a.key} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <BadgeMedal tier={a.tier} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mono-dim" style={{ fontSize: 12 }}>No awards yet. Keep training.</div>
              )}
            </Panel>

            <Panel style={{ padding: 28 }}>
              <span className="label" style={{ marginBottom: 6, display: 'block' }}>ACCOUNT</span>
              <div className="mono-dim" style={{ marginBottom: 18, fontSize: 11 }}>
                SIGNED IN VIA SINGPASS
              </div>
              <button className="btn danger full" onClick={signOut}>SIGN OUT</button>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ title, desc, on, onToggle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 3 }}>{desc}</div>
      </div>
      <button onClick={onToggle} disabled={!onToggle}
        style={{ all: 'unset', cursor: onToggle ? 'pointer' : 'default', flexShrink: 0,
          width: 46, height: 26, borderRadius: 999, padding: 3,
          background: on ? 'var(--accent)' : 'var(--bg)',
          border: `1px solid ${on ? 'var(--accent-line)' : 'var(--border-strong)'}`,
          transition: 'all 0.15s' }}>
        <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%',
          background: on ? '#fff' : 'var(--text-faint)',
          transform: on ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.15s' }} />
      </button>
    </div>
  );
}

function BadgeMedal({ tier }) {
  const color = tier === 'gold' ? 'var(--amber)' : tier === 'silver' ? 'var(--silver)' : '#A87B4A';
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="18" cy="23" r="11" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
      <text x="18" y="28" textAnchor="middle" fontSize="12" fill={color} fontFamily="var(--font-head)" fontWeight="700">★</text>
      <line x1="14" y1="12" x2="15.5" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="12" x2="20.5" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="14" y="2" width="8" height="4" rx="2" fill={color} />
    </svg>
  );
}

function ModuleToggle({ activeModule, onChange }) {
  return (
    <div className="module-toggle-wrap">
      <div className="module-toggle" role="tablist" aria-label="Module switch">
        <button className={activeModule === 'enlist' ? 'active' : ''} onClick={() => onChange('enlist')} type="button">
          Enlist
        </button>
        <button className={activeModule === 'serve' ? 'active' : ''} onClick={() => onChange('serve')} type="button">
          Serve
        </button>
        <div className={`module-toggle-thumb ${activeModule}`} />
      </div>
    </div>
  );
}

function ScreenHeader({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <header className={`screen-page-header ${className}`}>
      <div>
        {eyebrow && <span className="label screen-page-eyebrow">{eyebrow}</span>}
        <h1 className="h-display">{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="screen-page-action">{action}</div>}
    </header>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatBlock({ label, value, suffix }) {
  return (
    <div className="stat-block">
      <span>{label}</span>
      <strong>
        {value} {suffix || ''}
      </strong>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getPhase(enlistmentDate) {
  return getToday() < new Date(enlistmentDate) ? 'enlist' : 'serve';
}

function addYears(dateString, years) {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function daysBetween(fromDate, toDate) {
  const targetDate = toDate instanceof Date ? toDate : new Date(toDate);
  return Math.max(0, Math.ceil((targetDate - fromDate) / (1000 * 60 * 60 * 24)));
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitials(text) {
  return text
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function shortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
}

function toSeconds(value) {
  const [minutes, seconds] = value.split(':').map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return minutes * 60 + seconds;
}

function formatRunTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function calculateIpptScore(pushups, situps, runSeconds) {
  const pushupScore = Math.min(25, Math.floor(pushups / 2));
  const situpScore = Math.min(25, Math.floor(situps / 2));
  const runScore = Math.max(0, Math.min(50, Math.round((900 - runSeconds) / 6)));
  const score = Math.max(0, Math.min(100, pushupScore + situpScore + runScore));
  const award =
    score >= 85 ? 'Gold' : score >= 75 ? 'Silver' : score >= 61 ? 'Pass with Incentive' : score >= 51 ? 'Pass' : 'Below Pass';

  return { score, award };
}

async function moderateSupportMessage(text) {
  const verdict = await nlpService.moderate(text);
  const lower = text.toLowerCase();
  const hostileTerms = ['idiot', 'stupid', 'useless', 'pathetic', 'loser', 'shut up', 'dumb', 'weakling', 'hate you'];

  if (hostileTerms.some((term) => lower.includes(term))) {
    return {
      approved: false,
      reason: 'This chat is for peer support. Rephrase it with care before sending.',
    };
  }

  return verdict;
}

function getPbs(attempts) {
  return attempts.reduce(
    (best, attempt) => ({
      pushups: Math.max(best.pushups, attempt.pushups),
      situps: Math.max(best.situps, attempt.situps),
      runSeconds: Math.min(best.runSeconds, attempt.runSeconds),
    }),
    { pushups: 0, situps: 0, runSeconds: 9999 },
  );
}

function dominantFromScore(score) {
  if (score >= 0.6) return 'positive';
  if (score >= 0.4) return 'neutral';
  return 'negative';
}

// Builds a seed journal entry in the canonical shape:
// { id, timestamp, text, sentiment: { score, crisis, dominant }, prompt }
function seedEntry(date, prompt, text, score) {
  return {
    id: `seed-${date}`,
    timestamp: `${date}T20:00:00.000Z`,
    text,
    sentiment: { score, crisis: false, dominant: dominantFromScore(score) },
    prompt,
  };
}

// Accessors tolerate both the canonical shape and any legacy {date, score} entries.
function entryDay(entry) {
  return (entry.timestamp || entry.date || '').slice(0, 10);
}

function entryScore(entry) {
  return entry.sentiment?.score ?? entry.score ?? 0.5;
}

// Soft escalation trigger: the last 5 entries are all clearly low (< 0.4).
function isTrendDeclining(entries) {
  if (entries.length < 5) return false;
  return entries.slice(-5).every((entry) => entryScore(entry) < 0.4);
}

function getJournalStreak(entries) {
  if (!entries.length) return 0;

  const uniqueDays = [...new Set(entries.map((entry) => entryDay(entry)))]
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
  const today = getToday();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const latestEntry = new Date(uniqueDays[0]);
  const latestDay = new Date(latestEntry.getFullYear(), latestEntry.getMonth(), latestEntry.getDate());

  if (latestDay.getTime() !== cursor.getTime()) {
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);
    if (latestDay.getTime() !== yesterday.getTime()) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  for (const dateString of uniqueDays) {
    const entryDate = new Date(dateString);
    const day = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
    if (day.getTime() !== cursor.getTime()) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Local YYYY-MM-DD key (avoids the UTC drift of toISOString when bucketing by calendar day).
function localKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLongestStreak(entries) {
  const days = [...new Set(entries.map(entryDay).filter(Boolean))]
    .map((day) => localKey(new Date(day)))
    .sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of days) {
    const date = new Date(key);
    run = prev && Math.round((date - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

// Short, supportive read-back for a single past reflection (the "comment" in the list).
function expandReflection(entry) {
  const score = entryScore(entry);
  const seed = ((entry.text || '') + (entry.timestamp || '')).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (arr) => arr[seed % arr.length];

  if (score >= 0.75) return pick([
    "Had a solid session this morning — everything landed the way it was supposed to, and I didn't have to fight myself to get through it. The afternoon was quieter, but in a good way. Felt more settled than I have in a while.",
    "Training went well today. I was sharper, the reps felt cleaner, and I didn't clock out mentally before it was over. Whatever sleep I got last night helped and I carried it through the rest of the day.",
    "One of those days where the routine actually carried me rather than just grinding me down. Did the work, kept pace, had a decent meal. Didn't need much more than that to feel okay.",
    "Started slow but found my footing after the first hour. By the time we broke for the afternoon I felt more like myself — present, less in my own head. Good day overall.",
  ]);
  if (score >= 0.65) return pick([
    "Nothing standout, but nothing went sideways either. The training was manageable, I got through admin without too much friction, and my head was in the right place for most of it.",
    "Did what needed doing. Pace was reasonable, the pressure felt familiar rather than crushing. I've had worse weeks — finding a steadier rhythm makes a real difference.",
    "A bit flat in the morning but things levelled out by mid-afternoon. Kept the routine going, stayed on top of things. Not a great day, but a functional one.",
    "Not my best showing but a solid one. Got through training, kept my head, didn't let the small stuff pile up. That's the standard on most days and I hit it.",
  ]);
  if (score >= 0.50) return pick([
    "Mixed day. Some parts worked, others didn't. I felt distracted during the session and couldn't quite lock in, but I finished what I started. Flat by the evening, but nothing alarming.",
    "Woke up okay but it wore off by mid-morning. Finished the PT, got through the afternoon, but I was running on autopilot by the end. Nothing wrong — just a lot.",
    "There's a kind of grey that comes with certain days in service. Not bad, not good — just grey. I did the work, I was present enough. That had to be enough today.",
    "A bit heavy without a clear reason. Went through the motions, stayed level, made it to the end of the day. Couldn't pinpoint what was off, just something.",
  ]);
  if (score >= 0.35) return pick([
    "Harder day. The kind where even the routine feels like a bigger lift than it should. Got through it, but I was quieter than usual and not really present by the end of it.",
    "Slept poorly and it showed. Dragged myself through the morning, made it work, but the weight stuck around. Didn't talk about it much. Just kept moving.",
    "Something about today sat heavy. Couldn't pinpoint it — just a general low that made everything feel more effortful. I functioned, but I was carrying something.",
    "Off day. Nothing catastrophic, but I wasn't right. Kept it together in front of the others, got to the end of the day. It'll pass — it always does.",
  ]);
  return pick([
    "Rough one. I was struggling before the day even started and it didn't get much lighter. Kept to myself, did the minimum, held it together. Writing this down feels like the only honest thing I could do today.",
    "This one hit different. Couldn't shake the weight all day — not during training, not after. Got through it somehow. I don't really want to talk about it but I needed to write it somewhere.",
    "Not okay today, and I knew it early. Pushed through what I had to, kept my face straight, but inside it was loud. There's only so long you can carry that before it shows.",
    "Everything was harder than it should have been. The simplest things took effort and I was there in body but checked out everywhere else. Days like this remind you how much this place takes.",
  ]);
}

function reflectionComment(entry) {
  const score = Math.round(entryScore(entry) * 100);
  const dominant = entry.sentiment?.dominant || dominantFromScore(entryScore(entry));
  if (dominant === 'crisis') {
    return 'Crisis language was detected. Support resources were surfaced to you privately — nothing was shared.';
  }
  if (score >= 75) return 'Sentinel read this as a clearly positive day. Worth remembering what made it work.';
  if (score >= 60) return 'A steady, generally upbeat entry. Your private trend held up well here.';
  if (score >= 45) return 'A mixed, fairly neutral day. Nothing alarming in the language.';
  if (score >= 30) return 'The tone leaned low. If several days read like this, Sentinel will quietly offer you options.';
  return 'This reading was quite low. Be gentle with yourself — support is one tap away whenever you want it.';
}

function reflectionNarrative(entry) {
  const score = Math.round(entryScore(entry) * 100);
  const dominant = entry.sentiment?.dominant || dominantFromScore(entryScore(entry));
  if (dominant === 'crisis') {
    return 'This was a hard moment to put into words. Support resources were surfaced immediately — you didn\'t have to carry it alone. Looking back, reaching for help or even just naming it was the right move.';
  }
  if (score >= 75) return 'This was a good day — the kind worth holding onto. Whether it was a training milestone, a decent run, or just feeling more like yourself, the score reflects something that was genuinely working. Days like this anchor the harder ones.';
  if (score >= 60) return 'A solid day overall. Not every day has to be remarkable to count — steady effort and a clear head are their own kind of win. The trend held up here, which matters more than any single session.';
  if (score >= 45) return 'A mixed one. Some parts dragged, others were fine. That balance is more common than it looks from the outside — it doesn\'t signal anything alarming, just the ordinary texture of service life on a normal day.';
  if (score >= 30) return 'This one sat a bit heavier. The weight of whatever was going on came through in how you wrote. It didn\'t break anything, but it registered — and that\'s worth acknowledging. Getting through a low day still counts.';
  return 'A difficult day, honestly. The kind where even small things take real effort and the bigger picture feels distant. You put it into words anyway, which is harder than it sounds. That matters, even if it didn\'t feel like it at the time.';
}

function StreakCalendar({ entries, streakDays }) {
  const months = useMemo(() => {
    const counts = new Map();
    entries.forEach((entry) => {
      const day = entryDay(entry);
      if (!day) return;
      const key = localKey(new Date(day));
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const today = getToday();
    return Array.from({ length: 4 }, (_, monthIndex) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (3 - monthIndex), 1);
      const gridStart = new Date(monthDate);
      gridStart.setDate(gridStart.getDate() - gridStart.getDay());
      const weekCount = 4;
      return {
        key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
        label: monthDate.toLocaleDateString('en-SG', { month: 'short' }),
        weeks: Array.from({ length: weekCount }, (_, weekIndex) => ({
          key: weekIndex,
          days: Array.from({ length: 7 }, (_, dayIndex) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
            const key = localKey(date);
            const count = counts.get(key) || 0;
            return {
              key,
              count,
              level: Math.min(4, count),
              inMonth: date.getMonth() === monthDate.getMonth(),
              today: key === localKey(today),
              future: date > today,
            };
          }),
        })),
      };
    });
  }, [entries]);
  const totalEntries = entries.length;
  const longest = useMemo(() => getLongestStreak(entries), [entries]);

  return (
    <section className="sentinel-streak-card">
      <div className="sentinel-streak-head">
        <div>
          <span className="sentinel-section-label">Journal streak</span>
          <h2>Consistency &amp; reflection</h2>
        </div>
      </div>
      <div className="sentinel-streak-content">
        <div className="sentinel-streak-stats">
          <div>
            <span className="sentinel-streak-stat-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M8 13h3v3H8z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Current streak
            </span>
            <strong>{streakDays} days</strong>
          </div>
          <div><span>Longest</span><strong>{longest}</strong></div>
          <div><span>Entries</span><strong>{totalEntries}</strong></div>
        </div>
        <div className="sentinel-heatmap-wrap">
          <div className="sentinel-heatmap-days" aria-hidden="true">
            <span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span />
          </div>
          <div className="sentinel-heatmap-scroll">
            <div className="sentinel-heatmap">
              {months.map((month) => (
                <div key={month.key} className="sentinel-heatmap-month" style={{ flexGrow: month.weeks.length }}>
                  <span>{month.label}</span>
                  <div className="sentinel-heatmap-weeks" style={{ gridTemplateColumns: `repeat(${month.weeks.length}, 1fr)` }}>
                    {month.weeks.map((week) => (
                      <div key={week.key}>
                        {week.days.map((day) => (
                          <i
                            key={day.key}
                            className={`level-${day.level}${day.inMonth ? '' : ' outside'}${day.today ? ' today' : ''}${day.future ? ' future' : ''}`}
                            title={`${shortDate(day.key)} · ${day.count} ${day.count === 1 ? 'reflection' : 'reflections'}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="sentinel-heatmap-legend">
              <span>Fewer</span>
              {[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)}
              <span>More reflections</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWeekendPlanner(profile, goal, attempts) {
  const pbs = getPbs(attempts);
  const projected = calculateIpptScore(pbs.pushups, pbs.situps, pbs.runSeconds);
  const runTime = formatRunTime(pbs.runSeconds);
  const vocation = profile.vocation || 'General';

  if (projected.score < 61) {
    return {
      summary: `Current score ${projected.score}. Best 2.4km ${runTime}. Build aerobic base first, then reinforce IPPT movement quality around your ${vocation.toLowerCase()} workload.`,
      days: [
        {
          id: 'sat',
          label: 'Sat',
          duration: '60 min',
          workout: 'Run 5km easy. Finish with 4 x 1 min pace pickups, then 3 x 12 push-ups and 3 x 18 sit-ups. Cool down with calf, hip, and ankle mobility.',
        },
        {
          id: 'sun',
          label: 'Sun',
          duration: '35 min',
          workout: `Recovery walk or light jog for 20 min, then 2 rounds of planks, glute bridges, and stretch work. ${vocation} focus: stay fresh for the coming week and protect your lower body.`,
        },
      ],
    };
  }

  if (projected.score < 75) {
    return {
      summary: `You are in the ${projected.award} range at ${projected.score} points. This weekend should close the gap to the next band while staying compatible with ${vocation.toLowerCase()} demands.`,
      days: [
        {
          id: 'sat',
          label: 'Sat',
          duration: '55 min',
          workout: 'Run 5km steady. Finish with 3 push-up ladders and 3 sit-up ladders, then 4 x 100m relaxed strides to sharpen pace control.',
        },
        {
          id: 'sun',
          label: 'Sun',
          duration: '40 min',
          workout: `2.4km pace rehearsal at controlled effort, then core work and mobility. ${vocation} focus: add posture and carry-resilience work without overloading the legs.`,
        },
      ],
    };
  }

  if (projected.score < 85) {
    return {
      summary: `You are sitting at ${projected.score} points with ${runTime} for 2.4km. Focus on sharper pacing and repeatability without letting ${vocation.toLowerCase()} fatigue flatten your next attempt.`,
      days: [
        {
          id: 'sat',
          label: 'Sat',
          duration: '50 min',
          workout: 'Run 4km tempo with the middle 2km at strong controlled effort. Finish with 2 quality core circuits and 2 x max-form push-up sets.',
        },
        {
          id: 'sun',
          label: 'Sun',
          duration: '32 min',
          workout: `Short recovery run, breathing reset, and mobility work. ${vocation} focus: keep the body loose and preserve good movement quality for next week.`,
        },
      ],
    };
  }

  return {
    summary: `You are already in Gold range at ${projected.score} points. Hold fitness without overloading. ${vocation} prep this weekend should stay light, clean, and sustainable.`,
    days: [
      {
        id: 'sat',
        label: 'Sat',
        duration: '35 min',
        workout: 'Run 3km easy, then do one short form session for push-ups, sit-ups, and pacing drills. Keep the whole block smooth, not maximal.',
      },
      {
        id: 'sun',
        label: 'Sun',
        duration: '25 min',
        workout: `Mobility reset, lower-leg maintenance, and light core activation. ${vocation} focus: recover well and arrive fresh for the next training week.`,
      },
    ],
  };
}

function chartOptions({ yLabel = true, yTicks = true, min = 0, max = 100 } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fffdf8',
        titleColor: '#14211d',
        bodyColor: '#14211d',
        borderColor: 'rgba(20,33,29,0.12)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(20,33,29,0.08)' },
        ticks: { color: '#6f736b' },
      },
      y: {
        display: yLabel,
        min,
        max,
        grid: { color: 'rgba(20,33,29,0.08)' },
        ticks: yTicks ? { color: '#6f736b' } : { display: false },
      },
    },
  };
}

export default App;
