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
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { answerNsQuestion, analyzeSentiment, loginWithSingPass } from './mockServices';
import {
  buildTrainingPlan,
  peerPosts,
  starterQuestions,
  trainingActivity,
  unitRoster,
  wellnessPrompts,
  whatToExpect,
} from './data';

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
      { date: '2026-05-07', prompt: 'How are you ending today?', text: 'Tired but steady.', score: 0.71 },
      { date: '2026-05-08', prompt: 'How are you ending today?', text: 'A bit flat after training.', score: 0.64 },
      { date: '2026-05-09', prompt: 'How are you ending today?', text: 'Managed the day well.', score: 0.7 },
      { date: '2026-05-10', prompt: 'How are you ending today?', text: 'Energy was lower today.', score: 0.61 },
      { date: '2026-05-11', prompt: 'How are you ending today?', text: 'Felt stretched thin.', score: 0.58 },
      { date: '2026-05-12', prompt: 'How are you ending today?', text: 'Still okay, just worn out.', score: 0.55 },
      { date: '2026-05-13', prompt: 'How are you ending today?', text: 'Harder to switch off tonight.', score: 0.5 },
      { date: '2026-05-14', prompt: 'How are you ending today?', text: 'A little better after talking.', score: 0.57 },
      { date: '2026-05-15', prompt: 'How are you ending today?', text: 'Steadier day overall.', score: 0.62 },
      { date: '2026-05-16', prompt: 'How are you ending today?', text: 'Routine helped.', score: 0.66 },
      { date: '2026-05-17', prompt: 'How are you ending today?', text: 'Good pace today.', score: 0.69 },
      { date: '2026-05-18', prompt: 'How are you ending today?', text: 'Mentally clearer.', score: 0.72 },
      { date: '2026-05-19', prompt: 'How are you ending today?', text: 'Not perfect, but stable.', score: 0.74 },
    ],
  },
  community: {
    posts: peerPosts,
    concerns: [],
  },
  social: {
    trainingFeed: trainingActivity,
  },
  ui: {
    activeModule: '',
  },
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;

  try {
    const parsed = JSON.parse(saved);
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updater) => {
    setState((current) => updater(current));
  };

  return <AppRoutes state={state} updateState={updateState} />;
}

function AppRoutes({ state, updateState }) {
  const isReady = state.auth.isAuthenticated && state.onboarding.ipptGoal && state.onboarding.consented;

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isReady ? '/home' : state.auth.isAuthenticated ? '/setup/goal' : '/login'} replace />}
      />
      <Route path="/login" element={<LoginScreen state={state} updateState={updateState} />} />
      <Route path="/setup/goal" element={<ProfileSetupScreen state={state} updateState={updateState} />} />
      <Route path="/setup/consent" element={<ConsentScreen state={state} updateState={updateState} />} />
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
  const profile = state.auth.profile;
  const phase = getPhase(profile?.enlistmentDate);
  const activeModule = state.ui.activeModule || phase;

  const setActiveModule = (module) => {
    updateState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        activeModule: module,
      },
    }));
  };

  return (
    <div className={`app-frame module-${activeModule}`}>
      <div className="grain" />
      <div className="shell">
        <div className="shell-topbar">
          <div className="topbar-brand-block">
            <div className="shell-brand">COVER ME</div>
            <div className="shell-meta">One service journey. Two modules.</div>
          </div>
          <div className="topbar-actions">
            <NavLink to="/home" className="topbar-link">
              Home
            </NavLink>
            <ModuleToggle activeModule={activeModule} onChange={setActiveModule} />
            <NavLink to="/profile" className="topbar-profile-link">
              Profile
            </NavLink>
          </div>
        </div>
        <main className="screen-body">
          <Routes>
            <Route path="/home" element={<HomeDashboard state={state} phase={phase} activeModule={activeModule} />} />
            <Route path="/fitness-prep" element={<FitnessPrepScreen state={state} />} />
            <Route path="/ai-chat" element={<AiChatScreen />} />
            <Route path="/peer-intel" element={<PeerIntelScreen state={state} updateState={updateState} />} />
            <Route path="/peer-support" element={<PeerSupportWallScreen state={state} updateState={updateState} />} />
            <Route path="/buddy-tap" element={<BuddyTapScreen state={state} updateState={updateState} />} />
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
            <Route path="/what-to-expect" element={<WhatToExpectScreen />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.auth.isAuthenticated) {
      navigate('/setup/goal', { replace: true });
    }
  }, [navigate, state.auth.isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    const result = await loginWithSingPass();

    updateState((current) => ({
      ...current,
      auth: {
        isAuthenticated: true,
        profile: result.profile,
      },
    }));

    navigate('/setup/goal');
    setLoading(false);
  };

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <div className="auth-mark">COVER ME</div>
        <p className="auth-tagline">A clearer NS journey from uncertainty to service readiness.</p>
      </div>
      <div className="auth-panel">
        <p className="kicker">Secure access</p>
        <h1>Log in with Singpass</h1>
        <div className="rule" />
        <p className="auth-copy">
          Sign in once to pull your MINDEF-linked profile and enter the right module for where you
          are in the NS journey.
        </p>
        <button className="singpass-button" onClick={handleLogin} disabled={loading}>
          <span className="singpass-logo">S</span>
          <span>{loading ? 'Connecting...' : 'Log in with Singpass'}</span>
        </button>
      </div>
    </section>
  );
}

function ProfileSetupScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(state.onboarding.ipptGoal);

  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (state.onboarding.ipptGoal && state.onboarding.consented) {
    return <Navigate to="/home" replace />;
  }

  const options = [
    {
      label: 'Pass',
      points: '51-60 points',
      description: 'Build a stable baseline and clear the standard with confidence.',
    },
    {
      label: 'Pass with Incentive',
      points: '61-74 points',
      description: 'Push beyond the baseline and train for stronger payouts and consistency.',
    },
    {
      label: 'Silver',
      points: '75-84 points',
      description: 'Train above the baseline with stronger endurance and sharper event pacing.',
    },
    {
      label: 'Gold',
      points: '85+ points',
      description: 'Train for top-tier output across strength, endurance, and pace.',
    },
  ];

  const saveGoal = () => {
    if (!selected) return;

    updateState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        ipptGoal: selected,
      },
    }));

    navigate('/setup/consent');
  };

  return (
    <section className="setup-screen">
      <ScreenHeader eyebrow="Profile setup" title="What's your IPPT goal?" />
      <div className="card-stack">
        {options.map((option) => (
          <button
            key={option.label}
            className={`selection-card ${selected === option.label ? 'selected' : ''}`}
            onClick={() => setSelected(option.label)}
          >
            <div>
              <div className="selection-title">{option.label}</div>
              <div className="selection-subtitle">{option.points}</div>
            </div>
            <p>{option.description}</p>
          </button>
        ))}
      </div>
      <button className="primary-button" onClick={saveGoal} disabled={!selected}>
        Let's go.
      </button>
    </section>
  );
}

function ConsentScreen({ state, updateState }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(state.onboarding.consented);

  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (state.onboarding.consented) {
    return <Navigate to="/home" replace />;
  }

  const handleContinue = () => {
    if (!checked) return;

    updateState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        consented: true,
      },
    }));

    navigate('/home');
  };

  return (
    <section className="consent-screen">
      <div className="consent-card">
        <h1>Your journal is yours.</h1>
        <div className="consent-copy">
          <p>
            Cover Me uses NLP, or natural language processing, to look at the words in your journal
            entry and estimate a private sentiment score for you over time.
          </p>
          <p>
            The system does not publish your writing, send your raw text to commanders, or surface
            your entries to peers. For normal entries, the app stores your writing and its trend
            score only in your private journal view so you can look back on patterns over time.
          </p>
          <p>
            If language suggests immediate self-harm risk, the app does not save that entry. It
            only interrupts the flow to show crisis support resources directly to you.
          </p>
          <p>
            No commander, peer support leader, or third party ever sees your journal entries
            through this wellness feature.
          </p>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>I understand and want to enable wellness tracking</span>
        </label>
        <button className="primary-button" onClick={handleContinue} disabled={!checked}>
          Continue
        </button>
      </div>
    </section>
  );
}

function HomeDashboard({ state, phase, activeModule }) {
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
          ],
        };

  return (
    <section>
      <header className="top-bar">
        <div>
          <p className="kicker">{moduleContent.eyebrow}</p>
          <h1 className="welcome-title">Welcome back, {toTitleCase(firstName)}</h1>
        </div>
        <div className={`phase-chip ${activeModule}`}>{activeModule === 'enlist' ? 'ENLIST' : 'SERVE'}</div>
      </header>

      <div className="dashboard-hero">
        <div className="countdown-card">
          <div className="stat-number">{ordDays}</div>
          <div className="stat-label">days to ORD</div>
        </div>
        <div className="secondary-stack">
          {activeModule === 'enlist' ? (
            <div className="mini-panel">
              <span>Enlisting in</span>
              <strong>{enlistDays} days</strong>
            </div>
          ) : (
            <div className="mini-panel">
              <span>Week of NS</span>
              <strong>{phase === 'serve' ? `Week ${weekOfNs}` : 'Preview · Week 1'}</strong>
            </div>
          )}
          <div className="mini-panel">
            <span>Service profile</span>
            <strong>
              PES {profile.pesStatus}
              {profile.unit ? ` · ${profile.unit}` : ''}
            </strong>
          </div>
        </div>
      </div>

      <div className="module-summary-card">
        <p>{moduleContent.summary}</p>
      </div>

      <div className="feature-grid">
        {moduleContent.detailBlocks.map((block) => (
          <NavLink key={block.title} to={block.to} className="feature-card feature-link-card">
            <div className="feature-card-title">{block.title}</div>
            <p>{block.body}</p>
          </NavLink>
        ))}
      </div>
    </section>
  );
}

function FitnessPrepScreen({ state }) {
  const profile = state.auth.profile;
  const attempts = state.ippt.attempts;
  const pbs = getPbs(attempts);
  const currentScore = calculateIpptScore(pbs.pushups, pbs.situps, pbs.runSeconds).score;
  const plan = useMemo(
    () => buildTrainingPlan(profile.pesStatus, state.onboarding.ipptGoal, currentScore, profile.vocation),
    [currentScore, profile.pesStatus, profile.vocation, state.onboarding.ipptGoal],
  );

  return (
    <section>
      <ScreenHeader title="Your Pre-Enlistment Workout Plan" subtitle={plan.summary} />
      <div className="badge-row">
        <span className="info-badge">PES {profile.pesStatus}</span>
        <span className="info-badge">{profile.vocation}</span>
        <span className="info-badge">{state.onboarding.ipptGoal}</span>
      </div>
      <div className="horizontal-days">
        {plan.days.map((day) => (
          <article key={day.id} className="day-card">
            <div className="day-card-header">
              <span>{day.label}</span>
              <strong>{day.duration}</strong>
            </div>
            <p>{day.workout}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AiChatScreen({ embedded = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = (question) => {
    const prompt = question.trim();
    if (!prompt) return;

    const reply = answerNsQuestion(prompt);
    setMessages((current) => [...current, { role: 'user', text: prompt }, { role: 'assistant', text: reply }]);
    setInput('');
  };

  return (
    <section className={`chat-screen ${embedded ? 'embedded-chat-screen' : ''}`}>
      {!embedded && (
        <ScreenHeader
          title="Ask Anything"
          subtitle="Ask me anything about NS. I only answer from verified SAF sources. I'll tell you when I don't know."
        />
      )}
      {embedded && <p className="embedded-chat-intro">Ask about BMT, admin steps, packing, medical review, or NS terms.</p>}
      {messages.length === 0 && (
        <div className="chip-row">
          {starterQuestions.map((question) => (
            <button key={question} className="chip" onClick={() => sendMessage(question)}>
              {question}
            </button>
          ))}
        </div>
      )}
      <div className="chat-log">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}>
            <div className={`message-bubble ${message.role}`}>{message.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about enlistment, admin, training, or medical processes"
        />
        <button className="primary-button small" onClick={() => sendMessage(input)}>
          Send
        </button>
      </div>
    </section>
  );
}

function CommunityScreen({ state, updateState, activeModule }) {
  return activeModule === 'enlist' ? (
    <PeerIntelScreen state={state} updateState={updateState} />
  ) : (
    <PeerSupportWallScreen state={state} updateState={updateState} />
  );
}

function PeerIntelScreen({ state, updateState }) {
  return (
    <section className="feed-screen">
      <ScreenHeader
        title="Batch Advice Feed"
        subtitle="Real batch intel organised by vocation so pre-enlistees can learn from those who have already gone through it."
      />
      <FeedScreenContent
        state={state}
        updateState={updateState}
        emptyText="Be the first to share intel for your vocation."
        composeTitle="Submit Anonymous Intel"
        composePlaceholder="Share what would have helped you to know earlier."
        fullWidth
      />
    </section>
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
        state={state}
        updateState={updateState}
        emptyText="Be the first to post to the wall."
        composeTitle="Submit Support Post"
        composePlaceholder="Share support, what helped, or something others in service may need to hear."
      />
    </section>
  );
}

function FeedScreenContent({ state, updateState, emptyText, composeTitle, composePlaceholder, fullWidth = false }) {
  const [filters, setFilters] = useState({ vocation: 'All', unitType: 'All', batch: 'All' });
  const [expandedId, setExpandedId] = useState(1);
  const [showCompose, setShowCompose] = useState(false);
  const [postDraft, setPostDraft] = useState('');

  const filteredPosts = state.community.posts.filter((post) => {
    return (
      (filters.vocation === 'All' || post.vocation === filters.vocation) &&
      (filters.unitType === 'All' || post.unitType === filters.unitType) &&
      (filters.batch === 'All' || post.batch === filters.batch)
    );
  });

  const addPost = () => {
    if (!postDraft.trim()) return;

    updateState((current) => ({
      ...current,
      community: {
        ...current.community,
        posts: [
          {
            id: Date.now(),
            username: 'Anonymous_Fieldnote',
            recency: 'Just now',
            vocation: filters.vocation === 'All' ? 'General' : filters.vocation,
            unitType: filters.unitType === 'All' ? 'General' : filters.unitType,
            batch: filters.batch === 'All' ? '26/26' : filters.batch,
            verified: true,
            body: postDraft.trim(),
          },
          ...current.community.posts,
        ],
      },
    }));

    setPostDraft('');
    setShowCompose(false);
  };

  return (
    <>
      <div className="filter-bar">
        <select value={filters.vocation} onChange={(event) => setFilters({ ...filters, vocation: event.target.value })}>
          <option>All</option>
          <option>Infantry</option>
          <option>Signals</option>
          <option>Medic</option>
        </select>
        <select value={filters.unitType} onChange={(event) => setFilters({ ...filters, unitType: event.target.value })}>
          <option>All</option>
          <option>Combat</option>
          <option>Support</option>
          <option>Service</option>
        </select>
        <select value={filters.batch} onChange={(event) => setFilters({ ...filters, batch: event.target.value })}>
          <option>All</option>
          <option>23/24</option>
          <option>24/24</option>
          <option>24/25</option>
        </select>
      </div>

      <div className={`feed-list ${fullWidth ? 'feed-list-full' : ''}`}>
        {filteredPosts.length === 0 ? (
          <div className="empty-state">{emptyText}</div>
        ) : (
          filteredPosts.map((post) => {
            const expanded = post.id === expandedId;

            return (
              <article key={post.id} className="feed-card" onClick={() => setExpandedId(post.id)}>
                <div className="feed-meta">
                  <div>
                    <strong>{post.username}</strong>
                    <span>{post.recency}</span>
                  </div>
                  {post.verified && <span className="verified-badge">Verified</span>}
                </div>
                <div className="badge-row">
                  <span className="info-badge">{post.vocation}</span>
                  <span className="info-badge">{post.unitType}</span>
                  <span className="info-badge">{post.batch}</span>
                </div>
                <p className={expanded ? '' : 'clamped'}>{post.body}</p>
              </article>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setShowCompose(true)}>
        +
      </button>
      {showCompose && (
        <Modal title={composeTitle} onClose={() => setShowCompose(false)}>
          <textarea
            value={postDraft}
            onChange={(event) => setPostDraft(event.target.value)}
            placeholder={composePlaceholder}
            rows={6}
          />
          <button className="primary-button" onClick={addPost}>
            Submit to moderation queue
          </button>
        </Modal>
      )}
    </>
  );
}

function BuddyTapScreen({ state, updateState }) {
  const [buddyName, setBuddyName] = useState(unitRoster[0]);
  const [buddyComment, setBuddyComment] = useState('');
  const [submittedConcern, setSubmittedConcern] = useState(false);

  const submitConcern = () => {
    updateState((current) => ({
      ...current,
      community: {
        ...current.community,
        concerns: [
          ...current.community.concerns,
          { name: buddyName, comment: buddyComment.trim(), date: getToday().toISOString() },
        ],
      },
    }));
    setSubmittedConcern(true);
  };

  return (
    <section>
      <ScreenHeader
        title="Buddy Tap"
        subtitle="Anonymous single-action concern flag. Three independent taps trigger a supportive message directly to the person."
      />
      <div className="buddy-card">
        <h2>Cover a mate.</h2>
        <p>If someone seems off, let us know. Three independent reports send them an anonymous message of support. No names. No commanders.</p>
        {!submittedConcern ? (
          <>
            <select value={buddyName} onChange={(event) => setBuddyName(event.target.value)}>
              {unitRoster.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <textarea
              value={buddyComment}
              onChange={(event) => setBuddyComment(event.target.value)}
              placeholder="What did you notice? Add brief context so the support message can feel more grounded. Optional."
              rows={4}
            />
            <button className="primary-button" onClick={submitConcern}>
              Send concern
            </button>
          </>
        ) : (
          <div className="confirmation-card">
            <div className="checkmark">✓</div>
            <p>Noted. Your concern was recorded anonymously.</p>
          </div>
        )}
        <small>
          Three independent reports about the same person triggers an anonymous message sent directly to them: "Some people in your unit are thinking about you. Here are some resources." No one is identified. No superior is notified.
        </small>
      </div>
    </section>
  );
}

function TrainScreen({ state, updateState, activeModule }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ pushups: '', situps: '', runTime: '12:30', date: '2026-05-20' });
  const [postForm, setPostForm] = useState({ headline: '', detail: '', statline: '', tag: 'IPPT' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const attempts = state.ippt.attempts;
  const activityFeed = state.social.trainingFeed;
  const pbs = getPbs(attempts);
  const projected = calculateIpptScore(
    Number(form.pushups || pbs.pushups),
    Number(form.situps || pbs.situps),
    form.runTime ? toSeconds(form.runTime) : pbs.runSeconds,
  );

  const submitAttempt = () => {
    const runSeconds = toSeconds(form.runTime);
    if (!form.pushups || !form.situps || !runSeconds) return;

    updateState((current) => ({
      ...current,
      ippt: {
        attempts: [
          ...current.ippt.attempts,
          {
            date: form.date,
            pushups: Number(form.pushups),
            situps: Number(form.situps),
            runSeconds,
          },
        ],
      },
    }));

    setShowModal(false);
  };

  const chartData = {
    labels: attempts.map((attempt) => shortDate(attempt.date)),
    datasets: [
      {
        data: attempts.map((attempt) =>
          calculateIpptScore(attempt.pushups, attempt.situps, attempt.runSeconds).score,
        ),
        borderColor: '#4A7C59',
        backgroundColor: 'rgba(74, 124, 89, 0.14)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const publishPost = () => {
    if (!postForm.headline.trim() || !postForm.detail.trim()) return;

    updateState((current) => ({
      ...current,
      social: {
        ...current.social,
        trainingFeed: [
          {
            id: Date.now(),
            name: toTitleCase(current.auth.profile.fullName),
            unit: current.auth.profile.unit || 'NS Unit',
            recency: 'Just now',
            headline: postForm.headline.trim(),
            statline: postForm.statline.trim() || `${projected.score} pts`,
            detail: postForm.detail.trim(),
            chips: [postForm.tag, 'New Post'],
            reactions: { cheer: 0, fire: 0, respect: 0 },
            userReaction: '',
            comments: [],
          },
          ...current.social.trainingFeed,
        ],
      },
    }));

    setPostForm({ headline: '', detail: '', statline: '', tag: 'IPPT' });
  };

  const toggleReaction = (activityId, reactionType) => {
    updateState((current) => ({
      ...current,
      social: {
        ...current.social,
        trainingFeed: current.social.trainingFeed.map((item) => {
          if (item.id !== activityId) return item;

          const nextReactions = { ...item.reactions };
          if (item.userReaction) {
            nextReactions[item.userReaction] = Math.max(0, (nextReactions[item.userReaction] || 0) - 1);
          }

          const nextUserReaction = item.userReaction === reactionType ? '' : reactionType;
          if (nextUserReaction) {
            nextReactions[nextUserReaction] = (nextReactions[nextUserReaction] || 0) + 1;
          }

          return {
            ...item,
            reactions: nextReactions,
            userReaction: nextUserReaction,
          };
        }),
      },
    }));
  };

  const submitComment = (activityId) => {
    const draft = (commentDrafts[activityId] || '').trim();
    if (!draft) return;

    updateState((current) => ({
      ...current,
      social: {
        ...current.social,
        trainingFeed: current.social.trainingFeed.map((item) =>
          item.id === activityId
            ? {
                ...item,
                comments: [
                  ...item.comments,
                  {
                    id: Date.now(),
                    author: toTitleCase(current.auth.profile.fullName),
                    text: draft,
                    recency: 'Just now',
                  },
                ],
              }
            : item,
        ),
      },
    }));

    setCommentDrafts((current) => ({ ...current, [activityId]: '' }));
  };

  return (
    <section>
      <ScreenHeader
        title={activeModule === 'enlist' ? 'PES-Based Fitness Prep' : 'IPPT Tracker'}
        subtitle={
          activeModule === 'enlist'
            ? 'Use your current results to understand your prep gap before enlistment and train with more confidence.'
            : 'Log attempts, set goals, and close the gap to your active-service target.'
        }
      />
      <div className="stats-row">
        <StatBlock label="Push-up PB" value={pbs.pushups} suffix="reps" />
        <StatBlock label="Sit-up PB" value={pbs.situps} suffix="reps" />
        <StatBlock label="2.4km PB" value={formatRunTime(pbs.runSeconds)} />
      </div>
      <div className="goal-banner">{state.onboarding.ipptGoal} target</div>
      {activeModule === 'serve' && (
        <NavLink to="/weekend-planner" className="secondary-button">
          View Weekend IPPT Planner
        </NavLink>
      )}
      <div className="calculator-card">
        <h3>Projected Score</h3>
        <div className="projected-score">{projected.score}</div>
        <div className="award-line">{projected.award}</div>
        <div className="calculator-grid">
          <input
            type="number"
            placeholder="Push-ups"
            value={form.pushups}
            onChange={(event) => setForm({ ...form, pushups: event.target.value })}
          />
          <input
            type="number"
            placeholder="Sit-ups"
            value={form.situps}
            onChange={(event) => setForm({ ...form, situps: event.target.value })}
          />
          <input
            type="text"
            placeholder="MM:SS"
            value={form.runTime}
            onChange={(event) => setForm({ ...form, runTime: event.target.value })}
          />
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}>
          Log Attempt
        </button>
      </div>
      <div className="chart-card">
        <Line options={chartOptions({ yLabel: false })} data={chartData} />
      </div>
      <div className="activity-section">
        <div className="activity-section-header">
          <div>
            <p className="kicker">Training Feed</p>
            <h3>{activeModule === 'enlist' ? 'Prep circle activity' : 'Unit training activity'}</h3>
          </div>
          <span className="info-badge">Live PBs</span>
        </div>
        <div className="activity-composer">
          <div className="activity-composer-top">
            <div className="activity-avatar">{getInitials(state.auth.profile.fullName)}</div>
            <div>
              <strong>Post an update</strong>
              <span>Share a new PB, a hard session, or your projected score.</span>
            </div>
          </div>
          <div className="activity-composer-grid">
            <input
              type="text"
              placeholder="Headline"
              value={postForm.headline}
              onChange={(event) => setPostForm({ ...postForm, headline: event.target.value })}
            />
            <input
              type="text"
              placeholder="Stat line"
              value={postForm.statline}
              onChange={(event) => setPostForm({ ...postForm, statline: event.target.value })}
            />
            <select value={postForm.tag} onChange={(event) => setPostForm({ ...postForm, tag: event.target.value })}>
              <option>IPPT</option>
              <option>2.4km</option>
              <option>Push-ups</option>
              <option>Sit-ups</option>
              <option>Recovery</option>
            </select>
          </div>
          <textarea
            value={postForm.detail}
            onChange={(event) => setPostForm({ ...postForm, detail: event.target.value })}
            placeholder="What changed, what worked, or what you are proud of."
            rows={3}
          />
          <button className="primary-button small" onClick={publishPost}>
            Post update
          </button>
        </div>
        <div className="activity-feed">
          {activityFeed.map((item) => (
            <article key={item.id} className="activity-card">
              <div className="activity-topline">
                <div className="activity-user">
                  <div className="activity-avatar">{getInitials(item.name)}</div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.unit} · {item.recency}
                    </span>
                  </div>
                </div>
                <div className="activity-statline">{item.statline}</div>
              </div>
              <h4>{item.headline}</h4>
              <p>{item.detail}</p>
              <div className="activity-chip-row">
                {item.chips.map((chip) => (
                  <span key={chip} className="activity-chip">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="activity-action-row">
                {[
                  ['cheer', 'Cheer'],
                  ['fire', 'Fire'],
                  ['respect', 'Respect'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`activity-action ${item.userReaction === key ? 'active' : ''}`}
                    onClick={() => toggleReaction(item.id, key)}
                  >
                    {label} {item.reactions[key]}
                  </button>
                ))}
              </div>
              <div className="activity-comments">
                {item.comments.map((comment) => (
                  <div key={comment.id} className="activity-comment">
                    <strong>{comment.author}</strong>
                    <span>{comment.recency}</span>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
              <div className="activity-comment-composer">
                <input
                  type="text"
                  placeholder="Leave a comment"
                  value={commentDrafts[item.id] || ''}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                />
                <button type="button" className="secondary-button activity-comment-button" onClick={() => submitComment(item.id)}>
                  Comment
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <NavLink to="/fitness-prep" className="secondary-button">
        View IPPT/Vocation-Based Training Plan
      </NavLink>

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
    </section>
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

function JournalScreen({ state, updateState, activeModule }) {
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [crisisState, setCrisisState] = useState(false);
  const [dismissedDip, setDismissedDip] = useState(false);
  const prompt = wellnessPrompts[getToday().getDate() % wellnessPrompts.length];
  const entries = state.journal.entries.slice(-14);
  const reviewEntries = [...entries].reverse();
  const streakDays = getJournalStreak(state.journal.entries);
  const dipState = isTrendDeclining(entries);

  const submitEntry = async () => {
    if (!entry.trim()) return;
    setSaving(true);

    const result = await analyzeSentiment(entry);

    if (result.isCrisis) {
      setCrisisState(true);
      setSaving(false);
      return;
    }

    updateState((current) => ({
          ...current,
          journal: {
            entries: [
              ...current.journal.entries,
              { date: isoDate(getToday()), prompt, text: entry.trim(), score: result.score },
            ],
          },
        }));

    setEntry('');
    setSaving(false);
  };

  const chartData = {
    labels: entries.map((item) => shortDate(item.date)),
    datasets: [
      {
        data: entries.map((item) => item.score),
        borderColor: '#4A7C59',
        backgroundColor: 'rgba(74, 124, 89, 0.12)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <section>
      <ScreenHeader
        title="Sentinel"
        subtitle="Private reflection with NLP, or natural language processing, used only to estimate your own emotional trend."
      />
      <div className="badge-row">
        <span className="info-badge">Journal streak: {streakDays} day{streakDays === 1 ? '' : 's'}</span>
      </div>
      <div className="journal-layout">
        <div className="journal-entry-card">
          <p className="journal-prompt">{prompt}</p>
          <textarea
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
            placeholder="Write freely. This space is private."
            rows={7}
          />
          <button className="primary-button" onClick={submitEntry} disabled={saving}>
            {saving ? 'Processing...' : 'Submit'}
          </button>
        </div>
        <div className="chart-card">
          <div className="chart-caption">Your emotional trend - only you can see this.</div>
          <Line options={chartOptions({ yLabel: false, yTicks: false, min: 0.2, max: 0.95 })} data={chartData} />
          {dipState && !dismissedDip && (
            <div className="action-grid">
              <button className="soft-button">Chat with AI journaling companion</button>
              <button className="soft-button">Connect anonymously with peer support leader</button>
              <button className="soft-button">SAF counselling resources</button>
              <button className="soft-button" onClick={() => setDismissedDip(true)}>
                I'm okay, dismiss
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="journal-review-card">
        <div className="journal-review-header">
          <div>
            <p className="kicker">User-Controlled Escalation</p>
            <h3>How Sentinel responds</h3>
          </div>
        </div>
        <div className="escalation-list">
          <div className="escalation-item">
            <strong>When your trend declines for 5 or more days</strong>
            <p>
              Sentinel shows you your own graph and lets you decide what happens next. You can chat with an AI journaling
              companion, connect anonymously with a peer support leader, open SAF counselling resources, or dismiss the
              prompt.
            </p>
          </div>
          <div className="escalation-item">
            <strong>No automatic alerts to superiors</strong>
            <p>
              No sergeant, commander, or superior is notified automatically. The user decides how far the escalation goes,
              every time.
            </p>
          </div>
          <div className="escalation-item">
            <strong>One exception for explicit self-harm or suicide language</strong>
            <p>
              If a journal entry contains explicit self-harm or suicide language, crisis resources are surfaced immediately
              to the user, including helpline numbers and a direct SAF counselling path. Even then, no commander is
              notified. Resources are surfaced to the user only, never about them.
            </p>
          </div>
        </div>
        <div className="escalation-mockup-grid">
          <div className="escalation-mockup-card">
            <p className="kicker">Activated Mockup</p>
            <h4>Trend dip detected</h4>
            <div className="mockup-trend">
              <span className="mockup-trend-bar bar-1" />
              <span className="mockup-trend-bar bar-2" />
              <span className="mockup-trend-bar bar-3" />
              <span className="mockup-trend-bar bar-4" />
              <span className="mockup-trend-bar bar-5" />
              <span className="mockup-trend-bar bar-6" />
            </div>
            <p className="mockup-copy">
              We noticed your private trend has been lower for several days. You decide what happens next.
            </p>
            <div className="mockup-action-list">
              <button className="soft-button">Chat with AI journaling companion</button>
              <button className="soft-button">Connect anonymously with peer support leader</button>
              <button className="soft-button">SAF counselling resources</button>
              <button className="soft-button">I'm okay, dismiss</button>
            </div>
          </div>
          <div className="escalation-mockup-card crisis">
            <p className="kicker">Crisis Preview</p>
            <h4>Immediate support resources</h4>
            <p className="mockup-copy">
              This appears only when a journal entry contains explicit self-harm or suicide language. The entry is not
              saved, and no commander is notified.
            </p>
            <ul className="resource-list">
              <li>SAF Counselling Centre</li>
              <li>Direct SAF counsellor contact pathway</li>
              <li>IMH Mental Health Helpline: 6389 2222</li>
              <li>Samaritans of Singapore: 1767</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="journal-review-card">
        <div className="journal-review-header">
          <div>
            <p className="kicker">Review Past Entries</p>
            <h3>Past reflections</h3>
          </div>
          <span className="info-badge">{reviewEntries.length} saved</span>
        </div>
        <div className="journal-review-list">
          {reviewEntries.map((item, index) => (
            <article key={`${item.date}-${index}`} className="journal-review-item">
              <div className="journal-review-topline">
                <strong>{shortDate(item.date)}</strong>
                <span>{item.prompt}</span>
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>

      {crisisState && (
        <div className="overlay-alert">
          <div className="alert-card">
            <h2>Immediate support resources</h2>
            <p>
              Your entry was not saved. If you are in immediate danger or feel at risk, reach out now. These resources are
              shown only to you. No commander or superior is notified.
            </p>
            <ul className="resource-list">
              <li>SAF Counselling Centre</li>
              <li>Direct SAF counsellor contact pathway</li>
              <li>IMH Mental Health Helpline: 6389 2222</li>
              <li>Samaritans of Singapore: 1767</li>
            </ul>
            <button className="primary-button" onClick={() => setCrisisState(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WhatToExpectScreen() {
  return (
    <section>
      <ScreenHeader title="What to Expect" subtitle="A structured first-day overview for enlistment." />
      <div className="info-list">
        {whatToExpect.map((item) => (
          <article key={item} className="info-panel">
            {item}
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileScreen({ state, updateState, phase, activeModule }) {
  const profile = state.auth.profile;
  const navigate = useNavigate();
  const ordDate = addYears(profile.enlistmentDate, 2);
  const ordDays = daysBetween(getToday(), ordDate);

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    updateState(() => defaultState);
    navigate('/login');
  };

  return (
    <section>
      <ScreenHeader title="Profile" subtitle="Singpass and MINDEF-sourced service profile." />
      <div className="profile-layout">
        <div className="profile-card profile-hero-card">
          <p className="kicker">Service profile</p>
          <h2>{toTitleCase(profile.fullName)}</h2>
          <p className="profile-hero-meta">
            PES {profile.pesStatus}
            {profile.unit ? ` · ${profile.unit}` : ''}
          </p>
          <div className="profile-stat-row">
            <div className="profile-stat">
              <span>Current phase</span>
              <strong>{phase === 'enlist' ? 'Enlist' : 'Serve'}</strong>
            </div>
            <div className="profile-stat">
              <span>Module view</span>
              <strong>{activeModule === 'enlist' ? 'Enlist' : 'Serve'}</strong>
            </div>
            <div className="profile-stat">
              <span>Days to ORD</span>
              <strong>{ordDays}</strong>
            </div>
          </div>
        </div>
        <div className="profile-card">
          <ProfileRow label="Full name" value={toTitleCase(profile.fullName)} />
          <ProfileRow label="NRIC" value={profile.nric} />
          <ProfileRow label="Enlistment date" value={profile.enlistmentDate} />
          <ProfileRow label="PES status" value={profile.pesStatus} />
          <ProfileRow label="Unit" value={profile.unit || 'Pending assignment'} />
          <ProfileRow label="IPPT goal" value={state.onboarding.ipptGoal} />
        </div>
      </div>
      <button className="secondary-button" onClick={signOut}>
        Sign out
      </button>
    </section>
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
    <header className="screen-header">
      {eyebrow && <p className="kicker">{eyebrow}</p>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <div className="rule" />
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

function isTrendDeclining(entries) {
  if (entries.length < 5) return false;
  const recent = entries.slice(-5).map((entry) => entry.score);
  return recent.every((score, index) => index === 0 || score <= recent[index - 1]);
}

function getJournalStreak(entries) {
  if (!entries.length) return 0;

  const uniqueDays = [...new Set(entries.map((entry) => entry.date))].sort((a, b) => new Date(b) - new Date(a));
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
