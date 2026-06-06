import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import { peerIntelPosts } from './data/mockPeerIntel';
import { peerWallPosts } from './data/mockPeerWall';
import { trainingActivity } from './data';
import LandingPage from './pages/LandingPage';
import GoalSetupPage from './pages/GoalSetupPage';
import ConsentPage from './pages/ConsentPage';
import EnlistDashboardPage from './pages/EnlistDashboardPage';
import WhatToExpectPage from './pages/WhatToExpectPage';
import FitnessPrepPage from './pages/FitnessPrepPage';
import AiChatPage from './pages/AiChatPage';
import PeerIntelPage from './pages/PeerIntelPage';
import ServeDashboardPage from './pages/ServeDashboardPage';
import PeerSupportWallPage from './pages/PeerSupportWallPage';
import BuddyTapPage from './pages/BuddyTapPage';
import TrainPage from './pages/TrainPage';
import WeekendPlannerPage from './pages/WeekendPlannerPage';
import JournalPage from './pages/JournalPage';
import EscalationPage from './pages/EscalationPage';
import ProfilePage from './pages/ProfilePage';
import { getPhase, seedEntry } from './pages/shared/appScreenUtils';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const STORAGE_KEY = 'cover-me-state';

const defaultState = {
  auth: {
    isAuthenticated: false,
    profile: null,
  },
  onboarding: {
    ipptGoal: '',
    consented: false,
  },
  ippt: {
    attempts: [
      { date: '2026-01-12', pushups: 28, situps: 30, runSeconds: 840 },
      { date: '2026-03-18', pushups: 34, situps: 36, runSeconds: 790 },
      { date: '2026-05-02', pushups: 38, situps: 41, runSeconds: 760 },
    ],
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
    buddyTaps: [],
  },
  social: {
    trainingFeed: trainingActivity,
  },
  ui: {
    activeModule: '',
  },
};

function normalizeProfile(profile) {
  if (!profile) return null;

  const fullName = profile.fullName || profile.name || 'WEI';
  const pesStatus = profile.pesStatus || profile.pes || 'B1';

  return {
    ...profile,
    fullName,
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

    return {
      ...defaultState,
      ...parsed,
      auth: { ...defaultState.auth, ...parsed.auth },
      onboarding: { ...defaultState.onboarding, ...parsed.onboarding },
      ippt: { ...defaultState.ippt, ...parsed.ippt },
      journal: { ...defaultState.journal, ...parsed.journal },
      community: { ...defaultState.community, ...parsed.community },
      social: { ...defaultState.social, ...parsed.social },
      ui: { ...defaultState.ui, ...parsed.ui },
    };
  } catch {
    return defaultState;
  }
}

function App() {
  const [state, setState] = useState(loadState);
  const {
    activeModule,
    setActiveModule,
    ipptGoal,
    setIpptGoal,
    consented,
    setConsented,
    ipptLogs,
    setIpptLogs,
    trainingFeed,
    setTrainingFeed,
    intelPosts,
    setIntelPosts,
    wallPosts,
    setWallPosts,
    buddyTaps,
    setBuddyTaps,
    journalEntries,
    setJournalEntries,
  } = useAppContext();
  const { clearSession, syncAuthSession } = useAuth();
  const hydratedCommunityRef = useRef(false);
  const hydratedIpptRef = useRef(false);
  const hydratedJournalRef = useRef(false);
  const hydratedTrainingFeedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.auth.isAuthenticated && state.auth.profile) {
      syncAuthSession(
        state.auth.profile,
        activeModule || state.ui.activeModule || getPhase(state.auth.profile.enlistmentDate),
      );
    } else {
      clearSession();
    }
  }, [activeModule, clearSession, state.auth.isAuthenticated, state.auth.profile, state.ui.activeModule, syncAuthSession]);

  useEffect(() => {
    const nextModule = state.ui.activeModule || getPhase(state.auth.profile?.enlistmentDate);
    if (!activeModule && nextModule) {
      setActiveModule(nextModule);
    }
  }, [activeModule, setActiveModule, state.auth.profile?.enlistmentDate, state.ui.activeModule]);

  useEffect(() => {
    const nextGoal = state.onboarding.ipptGoal || '';
    if (!ipptGoal && nextGoal) {
      setIpptGoal(nextGoal);
    }
  }, [ipptGoal, setIpptGoal, state.onboarding.ipptGoal]);

  useEffect(() => {
    const nextConsented = Boolean(state.onboarding.consented);
    if (!consented && nextConsented) {
      setConsented(nextConsented);
    }
  }, [consented, setConsented, state.onboarding.consented]);

  useEffect(() => {
    if (hydratedIpptRef.current) {
      return;
    }

    hydratedIpptRef.current = true;
    setIpptLogs(state.ippt.attempts || []);
  }, [setIpptLogs, state.ippt.attempts]);

  useEffect(() => {
    if (hydratedCommunityRef.current) {
      return;
    }

    hydratedCommunityRef.current = true;
    setIntelPosts(state.community.intelPosts || []);
    setWallPosts(state.community.wallPosts || []);
    setBuddyTaps(state.community.buddyTaps || []);
  }, [setBuddyTaps, setIntelPosts, setWallPosts, state.community.buddyTaps, state.community.intelPosts, state.community.wallPosts]);

  useEffect(() => {
    if (hydratedJournalRef.current) {
      return;
    }

    hydratedJournalRef.current = true;
    setJournalEntries(state.journal.entries || []);
  }, [setJournalEntries, state.journal.entries]);

  useEffect(() => {
    if (hydratedTrainingFeedRef.current) {
      return;
    }

    hydratedTrainingFeedRef.current = true;
    setTrainingFeed(state.social.trainingFeed || []);
  }, [setTrainingFeed, state.social.trainingFeed]);

  useEffect(() => {
    if (!activeModule || state.ui.activeModule === activeModule) {
      return;
    }

    setState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        activeModule,
      },
    }));
  }, [activeModule, state.ui.activeModule]);

  useEffect(() => {
    if ((state.onboarding.ipptGoal || '') === ipptGoal) {
      return;
    }

    setState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        ipptGoal,
      },
    }));
  }, [ipptGoal, state.onboarding.ipptGoal]);

  useEffect(() => {
    if (Boolean(state.onboarding.consented) === consented) {
      return;
    }

    setState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        consented,
      },
    }));
  }, [consented, state.onboarding.consented]);

  useEffect(() => {
    const sameAttempts = JSON.stringify(state.ippt.attempts) === JSON.stringify(ipptLogs);
    if (sameAttempts) {
      return;
    }

    setState((current) => ({
      ...current,
      ippt: {
        ...current.ippt,
        attempts: ipptLogs,
      },
    }));
  }, [ipptLogs, state.ippt.attempts]);

  useEffect(() => {
    const sameIntel = JSON.stringify(state.community.intelPosts) === JSON.stringify(intelPosts);
    const sameWall = JSON.stringify(state.community.wallPosts) === JSON.stringify(wallPosts);
    const sameTaps = JSON.stringify(state.community.buddyTaps || []) === JSON.stringify(buddyTaps || []);

    if (sameIntel && sameWall && sameTaps) {
      return;
    }

    setState((current) => ({
      ...current,
      community: {
        ...current.community,
        intelPosts,
        wallPosts,
        buddyTaps,
      },
    }));
  }, [buddyTaps, intelPosts, state.community.buddyTaps, state.community.intelPosts, state.community.wallPosts, wallPosts]);

  useEffect(() => {
    const sameEntries = JSON.stringify(state.journal.entries) === JSON.stringify(journalEntries);
    if (sameEntries) {
      return;
    }

    setState((current) => ({
      ...current,
      journal: {
        ...current.journal,
        entries: journalEntries,
      },
    }));
  }, [journalEntries, state.journal.entries]);

  useEffect(() => {
    const sameTrainingFeed = JSON.stringify(state.social.trainingFeed) === JSON.stringify(trainingFeed);
    if (sameTrainingFeed) {
      return;
    }

    setState((current) => ({
      ...current,
      social: {
        ...current.social,
        trainingFeed,
      },
    }));
  }, [state.social.trainingFeed, trainingFeed]);

  const updateState = (updater) => {
    setState((current) => updater(current));
  };

  const resetAppState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    clearSession();
  };

  return <AppRoutes state={state} updateState={updateState} onResetAppState={resetAppState} />;
}

function AppRoutes({ state, updateState, onResetAppState }) {
  const { ipptGoal, consented } = useAppContext();
  const isReady =
    state.auth.isAuthenticated &&
    (ipptGoal || state.onboarding.ipptGoal) &&
    (consented || state.onboarding.consented);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isReady ? '/home' : state.auth.isAuthenticated ? '/setup/goal' : '/login'}
            replace
          />
        }
      />
      <Route path="/login" element={<LandingPage state={state} updateState={updateState} />} />
      <Route
        path="/setup/goal"
        element={<GoalSetupPage state={state} updateState={updateState} />}
      />
      <Route
        path="/setup/consent"
        element={<ConsentPage state={state} updateState={updateState} />}
      />
      <Route
        path="/*"
        element={
          isReady ? (
            <AppShell
              state={state}
              updateState={updateState}
              onResetAppState={onResetAppState}
            />
          ) : (
            <Navigate to={state.auth.isAuthenticated ? '/setup/goal' : '/login'} replace />
          )
        }
      />
    </Routes>
  );
}

function AppShell({ state, updateState, onResetAppState }) {
  const { activeModule } = useAppContext();
  const location = useLocation();
  const profile = state.auth.profile;
  const phase = getPhase(profile?.enlistmentDate);
  const routeModule =
    location.pathname.startsWith('/serve')
      ? 'serve'
      : location.pathname.startsWith('/enlist')
        ? 'enlist'
        : '';
  const resolvedActiveModule = routeModule || activeModule || state.ui.activeModule || phase;

  return (
    <div className={`app-frame module-${resolvedActiveModule}`}>
      <div className="grain" />
      <div className="shell">
        <Navbar />
        <main className="screen-body">
          <Routes>
            <Route path="/home" element={<Navigate to={`/${resolvedActiveModule}`} replace />} />
            <Route
              path="/enlist"
              element={
                <EnlistDashboardPage state={state} phase={phase} />
              }
            />
            <Route
              path="/serve"
              element={
                <ServeDashboardPage state={state} phase={phase} />
              }
            />
            <Route path="/fitness-prep" element={<FitnessPrepPage state={state} />} />
            <Route path="/ai-chat" element={<AiChatPage />} />
            <Route path="/peer-intel" element={<PeerIntelPage />} />
            <Route path="/peer-support" element={<PeerSupportWallPage />} />
            <Route path="/buddy-tap" element={<BuddyTapPage />} />
            <Route path="/escalation" element={<EscalationPage state={state} />} />
            <Route
              path="/community"
              element={
                resolvedActiveModule === 'enlist' ? (
                  <PeerIntelPage />
                ) : (
                  <PeerSupportWallPage />
                )
              }
            />
            <Route path="/journal" element={<JournalPage state={state} />} />
            <Route
              path="/train"
              element={
                <TrainPage state={state} activeModule={resolvedActiveModule} />
              }
            />
            <Route
              path="/weekend-planner"
              element={<WeekendPlannerPage state={state} activeModule={resolvedActiveModule} />}
            />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  state={state}
                  phase={phase}
                  activeModule={resolvedActiveModule}
                  onResetAppState={onResetAppState}
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

export default App;
