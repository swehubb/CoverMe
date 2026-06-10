import { useEffect, useMemo, useState } from 'react';
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
import { buddyTapSelectableMembers } from './data/mockPlatoon';
import nlpService from './services/nlpService';
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
import AiChatPage from './pages/AiChatPage';
import PeerIntelPage from './pages/PeerIntelPage';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const STORAGE_KEY = 'cover-me-state';

// Bump this whenever the seeded mock data below (journal, intel/wall posts, IPPT,
// training feed, etc.) changes. On load, a saved copy with an older version is
// dropped so the new seeds appear instead of being overridden by the stale cache.
const SEED_VERSION = 4;

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
    branch: 'army',
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
    if (parsed.__seedVersion !== SEED_VERSION) {
      // Seed data changed in code: start from the fresh seeds, but keep the user
      // signed in and their onboarding choices so they don't get logged out.
      return {
        ...defaultState,
        auth: { ...defaultState.auth, ...parsed.auth },
        onboarding: { ...defaultState.onboarding, ...parsed.onboarding },
      };
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
  return <HomeDashboard state={state} phase={phase} activeModule={module} />;
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
    localStorage.removeItem(STORAGE_KEY);
    updateState(() => defaultState);
    navigate('/login');
  };

  return (
    <div className="app-shell" data-branch={branch}>
      <CommandRail
        branch={branch}
        activeModule={activeModule}
        onSignOut={signOut}
        onModuleChange={setActiveModule}
      />
      <div className="shell-main">
        <TopBar branch={branch} onBranchChange={setBranch} profile={profile} />
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
            <Route path="/ai-chat" element={<AiChatPage />} />
            <Route path="/peer-intel" element={<PeerIntelPage state={state} />} />
            <Route path="/peer-support" element={<PeerSupportWallScreen state={state} updateState={updateState} />} />
            <Route path="/buddy-tap" element={<BuddyTapScreen state={state} updateState={updateState} />} />
            <Route path="/escalation" element={<EscalationScreen state={state} />} />
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
            <Route path="/weekend-planner" element={<WeekendPlannerScreen state={state} activeModule={activeModule} />} />
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




function HomeDashboard({ state, phase, activeModule }) {
  const navigate = useNavigate();
  const profile = state.auth.profile;
  const firstName = profile.fullName.split(' ')[1] || profile.fullName.split(' ')[0];
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);
  const enlistDays = daysBetween(getToday(), profile.enlistmentDate);
  const weekOfNs = getWeekOfNs(profile.enlistmentDate);
  const moduleContent =
    activeModule === 'enlist'
      ? {
          eyebrow: 'Module 1 · Enlist',
          summary:
            'Built for the pre-enlistee who has zero NS knowledge and maximum uncertainty. Every feature reduces a specific anxiety.',
          detailBlocks: [
            {
              title: 'What to Expect',
              body: 'A structured first-look at enlistment day, reporting flow, and what matters most early.',
              to: '/what-to-expect',
            },
            {
              title: 'PES-Based Fitness Prep',
              body: 'Training plans calibrated to your Physical Employment Status and chosen IPPT target.',
              to: '/fitness-prep',
            },
            {
              title: 'AI Chatbot',
              body: 'Retrieval-only SAF answers for jargon, admin questions, and day-one uncertainty.',
              to: '/ai-chat',
            },
            {
              title: 'Batch Advice Feed',
              body: 'Real batch intel organised by vocation so you know what helped others before enlistment.',
              to: '/peer-intel',
            },
          ],
        }
      : {
          eyebrow: 'Module 2 · Serve',
          summary:
            'Four interconnected features support physical performance, mental wellness, and peer solidarity throughout active service.',
          detailBlocks: [
            {
              title: 'IPPT Tracker',
              body: 'Log attempts, set goals, and follow an adaptive training roadmap with clear benchmarks.',
              to: '/train',
            },
            {
              title: 'Sentinel',
              body: 'Wellness journaling with NLP sentiment analysis and a user-controlled escalation ladder.',
              to: '/journal',
            },
            {
              title: 'Buddy Tap',
              body: 'Anonymous single-action concern flag. Three independent taps trigger a direct supportive message.',
              to: '/buddy-tap',
            },
            {
              title: 'Peer Support Wall',
              body: 'Named support posts by phase and topic, with resources surfaced before anything goes live.',
              to: '/peer-support',
            },
            {
              title: 'Support Options',
              body: 'User-controlled escalation: AI companion, peer support leader, or SAF counselling. You decide, every time.',
              to: '/escalation',
            },
          ],
        };

  const ordPct = Math.min(100, Math.round(((730 - ordDays) / 730) * 100));
  const ipptAttempts = state.ippt.attempts;
  const latestIppt = ipptAttempts.length ? ipptAttempts[ipptAttempts.length - 1] : null;
  const latestScore = latestIppt
    ? calculateIpptScore(latestIppt.pushups, latestIppt.situps, latestIppt.runSeconds)
    : null;
  const streakDays = getJournalStreak(state.journal.entries);

  return (
    <div className="dash-page">
      {/* Identity + ORD hero */}
      <Panel ticks elevated style={{ padding: 26, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 30, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 12 }}>ACTIVE SERVICE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
              <Insignia branch={state.ui?.branch || 'army'} size={28} />
            </div>
            <div>
              <div className="h-display" style={{ fontSize: 22 }}>{toTitleCase(profile.fullName)}</div>
              <div className="mono-dim" style={{ color: 'var(--text-dim)' }}>
                {profile.pesStatus} · {profile.unit} · {(profile.vocation || 'INFANTRY').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 30 }}>
          <span className="label" style={{ marginBottom: 8 }}>ORD COUNTDOWN</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="stat-val" style={{ fontSize: 56, color: 'var(--amber)' }}>{ordDays}</span>
            <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 14 }}>DAYS REMAINING</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
            <div style={{ width: `${ordPct}%`, height: '100%', background: 'var(--accent-2)' }} />
          </div>
          <div className="mono-dim" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span>WEEK {weekOfNs} OF NS</span><span>{ordPct}% COMPLETE</span>
          </div>
        </div>
      </Panel>

      {/* Readiness band */}
      <Panel flush style={{ marginBottom: 16, padding: '18px 26px' }}>
        <div className="readiness-band">
          <Stat label="LATEST IPPT" value={latestScore ? latestScore.score : '—'} unit="PTS" size={34} />
          <Stat label="CURRENT AWARD" value={latestScore ? latestScore.award : '—'} size={26} color="var(--amber)" />
          <Stat label="2.4KM PB" value={latestIppt ? formatRunTime(Math.min(...ipptAttempts.map((a) => a.runSeconds))) : '—'} size={34} />
          <Stat label="JOURNAL STREAK" value={streakDays} unit="D" size={34} />
        </div>
      </Panel>

      <span className="label" style={{ margin: '30px 0 14px', display: 'block' }}>MODULE DECK</span>
      <div className="dash-features-grid">
        {moduleContent.detailBlocks.map((block) => (
          <button key={block.title} className="feat-card" onClick={() => navigate(block.to)}>
            <Panel className="feat-card-inner" style={{ gap: 0 }}>
              <div style={{ marginTop: 'auto' }}>
                <div className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>{block.title}</div>
                <div className="feature-card-copy" style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>{block.body}</div>
                <span className="feat-card-arrow">Open →</span>
              </div>
            </Panel>
          </button>
        ))}
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
  return (
    <section className="feed-screen">
      <ScreenHeader
        title="Peer Support Wall"
        subtitle="Named support posts by phase and topic, with resources surfaced before anything goes live."
      />
      <FeedScreenContent
        posts={state.community.wallPosts}
        onAddPost={(post) =>
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: [post, ...current.community.wallPosts],
            },
          }))
        }
        onReply={(postId, reply) =>
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: current.community.wallPosts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      replies: [...(post.replies || []), reply],
                    }
                  : post,
              ),
            },
          }))
        }
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
                  {feedType === 'intel' && <span className="verified-badge">Q&A</span>}
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
  const [buddyId, setBuddyId] = useState(buddyTapSelectableMembers[0].id);
  const [buddyComment, setBuddyComment] = useState('');
  const [submittedConcern, setSubmittedConcern] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [thresholdNotice, setThresholdNotice] = useState(null);

  const taps = state.community.buddyTaps || [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCount = taps.filter((tap) => new Date(tap.timestamp).getTime() >= weekAgo).length;

  const submitConcern = async () => {
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

    const member = buddyTapSelectableMembers.find((m) => m.id === buddyId);
    const priorCount = taps.filter((tap) => tap.toUserId === buddyId).length;
    const newCount = priorCount + 1;

    updateState((current) => ({
      ...current,
      community: {
        ...current.community,
        buddyTaps: [
          ...(current.community.buddyTaps || []),
          { id: Date.now(), toUserId: buddyId, text: buddyComment.trim(), timestamp: new Date().toISOString() },
        ],
      },
    }));

    setSubmittedConcern(true);

    if (newCount >= 3) {
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
        <span className="info-badge">Taps this week: {weeklyCount}</span>
        <span className="info-badge">No commander is notified. No one is identified.</span>
      </div>
      <div className="buddy-card">
        <h2>Cover a mate.</h2>
        <p>If someone seems off, let us know. Three independent reports send them an anonymous message of support. No names. No commanders.</p>
        {!submittedConcern ? (
          <>
            <select value={buddyId} onChange={(event) => setBuddyId(event.target.value)}>
              {buddyTapSelectableMembers.map((member) => (
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
          <p>{thresholdNotice.body}</p>
          <ul className="resource-list">
            {thresholdNotice.resources.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <small>{thresholdNotice.footer}</small>
          <button className="primary-button" onClick={() => setThresholdNotice(null)}>
            Close
          </button>
        </Modal>
      )}
    </section>
  );
}

function TrainScreen({ state, updateState }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ pushups: '', situps: '', runTime: '12:30', date: isoDate(getToday()) });

  const attempts = state.ippt.attempts;
  const latest = attempts.length ? attempts[attempts.length - 1] : null;

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

  const GOAL_MAP = { Gold: 85, Silver: 75, 'Pass with Incentive': 61, Pass: 61 };
  const goalName  = state.onboarding.ipptGoal || 'Pass';
  const goalScore = GOAL_MAP[goalName] ?? 61;

  const chartSeries = attempts.map((a) => ({
    v:     calculateIpptScore(a.pushups, a.situps, a.runSeconds).score,
    label: shortDate(a.date),
  }));

  const submitAttempt = () => {
    const runSeconds = toSeconds(form.runTime);
    if (!form.pushups || !form.situps || !runSeconds) return;

    updateState((current) => ({
      ...current,
      ippt: {
        attempts: [
          ...current.ippt.attempts,
          { date: form.date, pushups: Number(form.pushups), situps: Number(form.situps), runSeconds },
        ],
      },
    }));

    setShowModal(false);
  };

  const stationRows = [
    { label: 'PUSH-UPS',   val: latest?.pushups,                             pts: stationPts?.pushups, max: 25 },
    { label: 'SIT-UPS',    val: latest?.situps,                              pts: stationPts?.situps,  max: 25 },
    { label: '2.4KM RUN',  val: latest ? formatRunTime(latest.runSeconds) : null, pts: stationPts?.run, max: 50 },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <h1 className="h-display" style={{ fontSize: 48, marginBottom: 24 }}>IPPT TRACKER</h1>

      {/* Row 1: 2-column overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 16, marginBottom: 16 }}>
        {/* CURRENT STANDING */}
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
              <div style={{
                width: `${Math.min(100, ((latestScore?.score ?? 0) / goalScore) * 100)}%`,
                height: '100%',
                background: 'var(--amber)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div className="mono-dim" style={{ marginTop: 6, textAlign: 'right' }}>
              {latestScore ? `${latestScore.score} / ${goalScore}` : `0 / ${goalScore}`}
            </div>
          </div>
        </Panel>

        {/* STATION BREAKDOWN */}
        <Panel ticks style={{ padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span className="label">STATION BREAKDOWN · LATEST</span>
            <button className="btn ghost sm" onClick={() => setShowModal(true)}>LOG ATTEMPT</button>
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
                <div style={{
                  width: `${s.pts != null ? (s.pts / s.max) * 100 : 0}%`,
                  height: '100%',
                  background: 'var(--amber)',
                  borderRadius: 2,
                }} />
              </div>
              <div className="mono-dim" style={{ marginTop: 3 }}>
                {s.pts != null ? `${s.pts} / ${s.max} pts` : '—'}
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* SCORE PROGRESSION chart */}
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
              color="var(--amber)"
              fmt={(v) => String(Math.round(v))}
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

      {/* ATTEMPT HISTORY */}
      <Panel ticks style={{ padding: 26 }}>
        <span className="label" style={{ marginBottom: 16, display: 'block' }}>IPPT ATTEMPT HISTORY</span>
        {attempts.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '110px repeat(3, 1fr) 70px 100px',
              padding: '0 0 8px',
              borderBottom: '1px solid var(--border)',
            }}>
              {['DATE', 'PUSH-UPS', 'SIT-UPS', '2.4KM', 'PTS', 'AWARD'].map((h) => (
                <span key={h} className="label">{h}</span>
              ))}
            </div>
            {[...attempts].reverse().map((attempt, i) => {
              const sc = calculateIpptScore(attempt.pushups, attempt.situps, attempt.runSeconds);
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px repeat(3, 1fr) 70px 100px',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <span className="mono-dim">{shortDate(attempt.date)}</span>
                  <span className="mono">{attempt.pushups}</span>
                  <span className="mono">{attempt.situps}</span>
                  <span className="mono">{formatRunTime(attempt.runSeconds)}</span>
                  <span className="mono" style={{ color: 'var(--amber)', fontWeight: 700 }}>{sc.score}</span>
                  <Award award={sc.award} />
                </div>
              );
            })}
          </>
        ) : (
          <div className="mono-dim" style={{ padding: '20px 0', textAlign: 'center' }}>
            No attempts logged yet.
          </div>
        )}
      </Panel>

      {showModal && (
        <Modal title="Log IPPT Attempt" onClose={() => setShowModal(false)}>
          <div className="modal-grid">
            <input
              type="number"
              placeholder="Push-up reps"
              value={form.pushups}
              onChange={(event) => setForm({ ...form, pushups: event.target.value })}
            />
            <input
              type="number"
              placeholder="Sit-up reps"
              value={form.situps}
              onChange={(event) => setForm({ ...form, situps: event.target.value })}
            />
            <input
              type="text"
              placeholder="2.4km MM:SS"
              value={form.runTime}
              onChange={(event) => setForm({ ...form, runTime: event.target.value })}
            />
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
          <button className="primary-button" onClick={submitAttempt}>
            Save attempt
          </button>
        </Modal>
      )}
    </div>
  );
}

function WeekendPlannerScreen({ state, activeModule }) {
  const profile = state.auth.profile;
  const weekendPlanner = getWeekendPlanner(profile, state.onboarding.ipptGoal, state.ippt.attempts);

  return (
    <section>
      <ScreenHeader
        title="Weekend IPPT Planner"
        subtitle={
          activeModule === 'serve'
            ? 'A dedicated two-day workout block based on your current IPPT band and service vocation.'
            : 'A dedicated two-day workout block based on your current IPPT band and target.'
        }
      />
      <div className="badge-row">
        <span className="info-badge">PES {profile.pesStatus}</span>
        <span className="info-badge">{profile.vocation}</span>
        <span className="info-badge">{state.onboarding.ipptGoal}</span>
      </div>
      <div className="weekend-planner-card static">
        <div className="weekend-planner-topline">
          <div>
            <p className="kicker">This Weekend</p>
            <h3>IPPT/Vocation-Based Weekend Plan</h3>
          </div>
          <span className="info-badge">{profile.vocation}</span>
        </div>
        <p className="weekend-planner-summary">{weekendPlanner.summary}</p>
        <div className="horizontal-days weekend-days">
          {weekendPlanner.days.map((day) => (
            <article key={day.id} className="day-card">
              <div className="day-card-header">
                <span>{day.label}</span>
                <strong>{day.duration}</strong>
              </div>
              <p>{day.workout}</p>
            </article>
          ))}
        </div>
      </div>
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
      // Crisis: surface resources to the user, do NOT save the entry, notify no one.
      setCrisisState(true);
      setSaving(false);
      return;
    }

    updateState((current) => ({
      ...current,
      journal: {
        ...current.journal,
        entries: [
          ...current.journal.entries,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            text: entry.trim(),
            sentiment: result,
            prompt,
          },
        ],
      },
    }));

    setEntry('');
    setSaving(false);
  };

  const scoreSeries = entries.map((item) => Math.round(entryScore(item) * 100));
  const latestScore = scoreSeries.length ? scoreSeries[scoreSeries.length - 1] : null;
  const chartData = {
    labels: entries.map((item) => shortDate(entryDay(item))),
    datasets: [
      {
        data: scoreSeries,
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

  const svgScores = entries.map((item) => ({ v: entryScore(item) }));
  const declining = dipState;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      {/* Header + Streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 className="h-display" style={{ fontSize: 48 }}>SENTINEL</h1>
        </div>
        <Panel flush style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="stat-label">JOURNAL STREAK</span>
            <span className="stat-val" style={{ fontSize: 30 }}>{streakDays}</span>
            <span className="stat-unit" style={{ fontSize: 16, color: 'var(--text-dim)', marginLeft: 0 }}>NIGHTS</span>
          </div>
        </Panel>
      </div>
      <StreakCalendar entries={state.journal.entries} streakDays={streakDays} />

      <div className="sentinel-grid" style={{ marginBottom: 24 }}>
        {/* Left — prompt + entry */}
        <Panel ticks style={{ padding: 24 }}>
          <span className="label" style={{ marginBottom: 12 }}>TONIGHT'S REFLECTION</span>
          <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26, lineHeight: 1.15, marginBottom: 18 }}>{prompt}</p>
          <textarea
            className="journal-textarea"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write freely. No scores, no judgement — just what's on your mind."
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span className="mono-dim">PRIVATE · ENCRYPTED · {entry.trim().split(/\s+/).filter(Boolean).length} WORDS</span>
            <button className="btn" disabled={saving || !entry.trim()} onClick={submitEntry}>
              {saving ? 'REFLECTING…' : 'SUBMIT ENTRY'}
            </button>
          </div>
        </Panel>

        {/* Right — trend chart */}
        <Panel ticks style={{ padding: '22px 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="label">EMOTIONAL TREND · {entries.length} NIGHTS</span>
            <span className="mono-dim" style={{ color: declining ? 'var(--danger)' : 'var(--success)' }}>
              {declining ? '▼ DECLINING' : '▲ STABLE'}
            </span>
          </div>
          <SvgLineChart
            data={svgScores}
            accessor={(d) => d.v}
            yMax={1} yMin={0}
            height={200}
            color={declining ? '#D98A55' : 'var(--amber)'}
            fmt={(v) => v.toFixed(1)}
          />
          <div className="mono-dim" style={{ marginTop: 6 }}>
            {trendInfo ? trendInfo.narrative : 'Self-awareness is the mechanism. Only you ever see this graph.'}
          </div>
          {declining && !dismissedDip && (
            <button className="btn ghost full" style={{ marginTop: 14 }} onClick={() => navigate('/escalation')}>
              REVIEW SUPPORT OPTIONS →
            </button>
          )}
          {declining && !dismissedDip && (
            <button className="btn neutral full" style={{ marginTop: 8 }} onClick={() => setDismissedDip(true)}>
              I'M OKAY, DISMISS
            </button>
          )}
        </Panel>
      </div>
      {/* How Sentinel responds */}
      <span className="label" style={{ margin: '30px 0 12px', display: 'block' }}>HOW SENTINEL RESPONDS</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16, marginBottom: 24 }}>
        <Panel ticks style={{ padding: 26 }}>
          {[
            ['▷', 'WHEN YOUR TREND DECLINES', 'If your private trend drops for 5+ days, Sentinel shows you your own graph and lets you decide: AI companion, peer support, SAF counselling, or dismiss. Always your call.'],
            ['◈', 'NO AUTOMATIC ALERTS TO SUPERIORS', 'No sergeant, commander, or superior is ever notified automatically. You decide how far any escalation goes, every single time.'],
            ['◮', 'ONE EXCEPTION — EXPLICIT CRISIS LANGUAGE', 'If an entry contains explicit self-harm or suicide language, crisis resources are surfaced to you immediately. Even then, no commander is notified.'],
          ].map(([icon, t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <span style={{ color: 'var(--accent-text)', marginTop: 1, fontSize: 15, width: 18, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, letterSpacing: '0.03em', marginBottom: 4 }}>{t}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.55 }}>{d}</div>
              </div>
            </div>
          ))}
        </Panel>
        <Panel style={{ padding: 26 }}>
          <span className="label" style={{ marginBottom: 6 }}>SUPPORT RESOURCES</span>
          <div className="mono-dim" style={{ marginBottom: 18 }}>CONFIDENTIAL · ALWAYS AVAILABLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['SAF COUNSELLING CENTRE', 'Direct counsellor pathway', 'BOOK'],
              ['SAF COUNSELLING CARELINE', '24-hour', '1800 278 0022'],
              ['IMH MENTAL HEALTH HELPLINE', '24-hour', '6389 2222'],
              ['SAMARITANS OF SINGAPORE', 'SOS · 24-hour', '1767'],
            ].map(([t, sub, n]) => (
              <div key={t} className="crisis-resource-row">
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>{t}</div>
                  <div className="mono-dim" style={{ fontSize: 10.5 }}>{sub}</div>
                </div>
                <span className="mono" style={{ color: 'var(--amber)', fontSize: 15 }}>{n}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Past reflections */}
      <span className="label" style={{ margin: '0 0 12px', display: 'block' }}>PAST REFLECTIONS</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allReflections.length === 0 ? (
          <div className="empty-state">No reflections yet. Your first entry will appear here.</div>
        ) : allReflections.map((item, index) => {
          const score = entryScore(item);
          return (
            <Panel key={item.id ?? `${entryDay(item)}-${index}`} flush
              className="past-entry-row"
              style={{ borderLeftColor: score < 0.5 ? 'var(--danger)' : 'var(--accent)' }}
            >
              <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 12, width: 52 }}>{shortDate(entryDay(item))}</span>
              <span className="past-entry-score" style={{ color: score < 0.5 ? '#D98A55' : 'var(--amber)' }}>
                {score.toFixed(2)}
              </span>
              <span style={{ flex: 1, color: 'var(--text-dim)', fontSize: 13.5 }}>{item.text}</span>
            </Panel>
          );
        })}
      </div>

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
            <button className="btn neutral full" onClick={() => setCrisisState(false)}>I'VE SEEN THIS → CLOSE</button>
          </Panel>
        </div>
      )}
    </div>
  );
}


function EscalationScreen({ state }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCrisis = params.get('crisis') === 'true';
  const [acknowledged, setAcknowledged] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [peerSent, setPeerSent] = useState(false);

  // AI companion chat (multi-turn within the session).
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const entries = state.journal.entries.slice(-7);
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

  return (
    <section>
      <ScreenHeader
        title="Your support options"
        subtitle="No commander is notified. You decide, every time."
      />

      <div className="chart-card sentinel-chart-card">
        <div className="chart-caption">Your last 7 days — scored out of 100, only you can see this.</div>
        <div className="sentinel-chart-canvas">
          <Line options={chartOptions({ yLabel: true, yTicks: true, min: 0, max: 100 })} data={chartData} />
        </div>
      </div>

      <div className="escalation-options">
        <article className={`escalation-option ${activePanel === 'companion' ? 'active' : ''}`}>
          <h3>AI journalling companion</h3>
          <p>Talk it through with a warm, non-judgmental companion. Private to you.</p>
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
          <p>Send an anonymous request to a trained peer supporter in your unit. No names shared.</p>
          <button className="soft-button" onClick={() => setPeerSent(true)}>
            Request anonymously
          </button>
        </article>

        <article className="escalation-option">
          <h3>SAF counselling</h3>
          <p>Speak with a SAF counsellor. Confidential and free.</p>
          <div className="contact-card">
            <strong>SAF Counselling Hotline</strong>
            <a href="tel:1800-278-0022">1800-278-0022</a>
          </div>
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
            An anonymous request has been sent to your unit's peer support leader. Your identity is not attached —
            they'll simply know someone reached out and is open to a chat.
          </p>
          <button className="primary-button" onClick={() => setPeerSent(false)}>
            Close
          </button>
        </Modal>
      )}

      {isCrisis && !acknowledged && (
        <div className="overlay-alert">
          <div className="alert-card">
            <h2>{crisisResources.title}</h2>
            <p>{crisisResources.message}</p>
            <ul className="resource-list">
              {crisisResources.resources.map((resource) => (
                <li key={resource.name}>
                  <strong>{resource.name}</strong>: {resource.number}
                  {resource.hours ? ` · ${resource.hours}` : ''}
                </li>
              ))}
            </ul>
            <small>{crisisResources.disclaimer}</small>
            <button className="primary-button" onClick={() => setAcknowledged(true)}>
              I have read these resources
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfileScreen({ state, updateState }) {
  const profile = state.auth.profile;
  const navigate = useNavigate();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);

  const [platoonFeed, setPlatoonFeed] = useState(true);
  const [eveningReminder, setEveningReminder] = useState(true);

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
    localStorage.removeItem(STORAGE_KEY);
    updateState(() => defaultState);
    navigate('/login');
  };

  const setGoal = (key) =>
    updateState((c) => ({ ...c, onboarding: { ...c.onboarding, ipptGoal: key } }));
  const setBranch = (b) =>
    updateState((c) => ({ ...c, ui: { ...c.ui, branch: b } }));
  const toggleConsent = () =>
    updateState((c) => ({ ...c, onboarding: { ...c.onboarding, consented: !c.onboarding.consented } }));

  const GOAL_TIERS = [
    { key: 'Pass',   label: 'PASS',   min: 61 },
    { key: 'Silver', label: 'SILVER', min: 75 },
    { key: 'Gold',   label: 'GOLD',   min: 85 },
  ];

  const BRANCH_LIST = [
    { key: 'army', label: 'LAND' },
    { key: 'navy', label: 'SEA' },
    { key: 'air',  label: 'AIR' },
    { key: 'dis',  label: 'DIGITAL' },
  ];

  const BRANCH_FORCE_LABEL = { army: 'LAND FORCE', navy: 'SEA FORCE', air: 'AIR FORCE', dis: 'DIGITAL FORCE' };

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
            <span className="label" style={{ marginBottom: 18, display: 'block' }}>IPPT OBJECTIVE</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
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
                    <span className="mono" style={{ fontSize: 13, color: active ? 'var(--amber)' : 'var(--text-faint)' }}>
                      {t.min} PTS
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

            <span className="label" style={{ marginBottom: 18, display: 'block' }}>SERVICE THEME</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {BRANCH_LIST.map(({ key: k, label }) => {
                const active = branch === k;
                return (
                  <button key={k} onClick={() => setBranch(k)} data-branch={k}
                    style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8, padding: '16px 6px', borderRadius: 8,
                      border: `1px solid ${active ? 'var(--accent-line)' : 'var(--border-strong)'}`,
                      background: active ? 'var(--accent-soft)' : 'var(--bg)' }}>
                    <span style={{ color: active ? 'var(--accent-text)' : 'var(--text-dim)' }}>
                      <Insignia branch={k} size={24} />
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap',
                      color: active ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
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
                on={state.onboarding.consented}
                onToggle={toggleConsent}
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
                onToggle={() => setEveningReminder((v) => !v)}
              />
            </div>
          </Panel>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Panel style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span className="label">RECENT AWARDS</span>
                <span className="mono-dim" style={{ fontSize: 11 }}>VIEW ALL →</span>
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
                Signed in via SingPass · BUILD 2.4.0
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

function ScreenHeader({ eyebrow, title, subtitle }) {
  return (
    <header style={{ marginBottom: 24 }}>
      {eyebrow && <span className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>{eyebrow}</span>}
      <h1 className="h-display" style={{ fontSize: 48 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>{subtitle}</p>}
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

function getWeekOfNs(enlistmentDate) {
  const start = new Date(enlistmentDate);
  const diff = Math.max(0, getToday() - start);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
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

// Heat level (0 = no entry, 1–4 = increasing positivity) for the contribution grid.
function scoreLevel(score) {
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 45) return 2;
  return 1;
}

// Builds a GitHub/NeetCode-style contribution grid: an array of week columns, each
// holding 7 day cells (Sun→Sat), ending on the Saturday of the current week.
function buildStreakCalendar(entries, weeks = 15) {
  const dayScore = new Map();
  entries.forEach((entry) => {
    const day = entryDay(entry);
    if (!day) return;
    const key = localKey(new Date(day));
    const score = Math.round(entryScore(entry) * 100);
    dayScore.set(key, Math.max(dayScore.get(key) ?? 0, score));
  });

  const today = getToday();
  const todayKey = localKey(today);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // roll forward to Saturday
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1)); // first cell is a Sunday

  const columns = [];
  for (let w = 0; w < weeks; w += 1) {
    const days = [];
    let monthLabel = '';
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + d);
      const key = localKey(date);
      const score = dayScore.has(key) ? dayScore.get(key) : null;
      // Label a column with the month name when its top cell starts a new month.
      if (d === 0 && date.getDate() <= 7) {
        monthLabel = date.toLocaleDateString('en-SG', { month: 'short' });
      }
      days.push({
        key,
        score,
        level: score == null ? 0 : scoreLevel(score),
        isFuture: date.getTime() > today.getTime(),
        isToday: key === todayKey,
      });
    }
    columns.push({ days, monthLabel });
  }
  return columns;
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

function StreakCalendar({ entries, streakDays }) {
  const columns = useMemo(() => buildStreakCalendar(entries, 15), [entries]);
  const totalEntries = useMemo(
    () => new Set(entries.map(entryDay).filter(Boolean)).size,
    [entries],
  );
  const longest = useMemo(() => getLongestStreak(entries), [entries]);

  return (
    <div className="streak-card">
      <div className="streak-head">
        <div>
          <p className="kicker">Journal streak</p>
          <h3 className="streak-title">
            <span className="streak-flame" aria-hidden>🔥</span>
            {streakDays} day{streakDays === 1 ? '' : 's'}
          </h3>
        </div>
        <div className="streak-stats">
          <div className="streak-stat">
            <strong>{longest}</strong>
            <span>Longest</span>
          </div>
          <div className="streak-stat">
            <strong>{totalEntries}</strong>
            <span>Entries</span>
          </div>
        </div>
      </div>

      <div className="streak-body">
        <div className="streak-weekdays" aria-hidden>
          <span />
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
        </div>
        <div className="streak-grid-wrap">
          <div className="streak-months" aria-hidden>
            {columns.map((col, i) => (
              <span key={i} className="streak-month-label">
                {col.monthLabel}
              </span>
            ))}
          </div>
          <div className="streak-grid">
            {columns.map((col, i) => (
              <div key={i} className="streak-col">
                {col.days.map((cell) => (
                  <span
                    key={cell.key}
                    className={`streak-cell lvl-${cell.level}${cell.isFuture ? ' is-future' : ''}${
                      cell.isToday ? ' is-today' : ''
                    }`}
                    title={
                      cell.isFuture
                        ? ''
                        : `${shortDate(cell.key)} · ${cell.score != null ? `${cell.score}/100` : 'No entry'}`
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="streak-legend" aria-hidden>
        <span>Less</span>
        <span className="streak-cell lvl-0" />
        <span className="streak-cell lvl-1" />
        <span className="streak-cell lvl-2" />
        <span className="streak-cell lvl-3" />
        <span className="streak-cell lvl-4" />
        <span>More</span>
      </div>
    </div>
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
