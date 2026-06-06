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
import Navbar from './components/layout/Navbar';
import PageWrapper from './components/layout/PageWrapper';
import ORDCountdown from './components/shared/ORDCountdown';
import FeatureCard from './components/shared/FeatureCard';
import { peerIntelPosts } from './data/mockPeerIntel';
import { peerWallPosts, wallPhases, wallTopics } from './data/mockPeerWall';
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
      if (current.ui.activeModule === module) {
        return current;
      }

      return {
        ...current,
        ui: {
          ...current.ui,
          activeModule: module,
        },
      };
    });
  }, [module, updateState]);

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
    setAuthCurrentModule(module);
  };

  return (
    <div className={`app-frame module-${activeModule}`}>
      <div className="grain" />
      <div className="shell">
        <Navbar />
        <main className="screen-body">
          <Routes>
            <Route path="/home" element={<Navigate to={`/${activeModule}`} replace />} />
            <Route
              path="/enlist"
              element={<EnlistDashboardPage state={state} updateState={updateState} phase={phase} />}
            />
            <Route
              path="/serve"
              element={<ModuleHomeRoute module="serve" state={state} updateState={updateState} phase={phase} />}
            />
            <Route path="/fitness-prep" element={<FitnessPrepPage state={state} />} />
            <Route path="/ai-chat" element={<AiChatPage />} />
            <Route path="/peer-intel" element={<PeerIntelPage state={state} updateState={updateState} />} />
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

  return (
    <PageWrapper
      title={`Welcome back, ${toTitleCase(firstName)}`}
      description={moduleContent.summary}
      module={activeModule}
    >
      <p className="kicker">{moduleContent.eyebrow}</p>
      <div className="dashboard-hero">
        <ORDCountdown
          enlistmentDate={profile.enlistmentDate}
          ordDate={ordDate}
          value={ordDays}
          label="DAYS TO ORD"
        />
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
        </div>
      </div>

      <div className="feature-grid">
        {moduleContent.detailBlocks.map((block) => (
          <FeatureCard
            key={block.title}
            title={block.title}
            description={block.body}
            eyebrow={activeModule === 'enlist' ? 'Enlist Feature' : 'Serve Feature'}
            onClick={() => navigate(block.to)}
          />
        ))}
      </div>
    </PageWrapper>
  );
}



function CommunityScreen({ state, updateState, activeModule }) {
  return activeModule === 'enlist' ? (
    <PeerIntelPage state={state} updateState={updateState} />
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
        onVote={(postId, direction) =>
          updateState((current) => ({
            ...current,
            community: {
              ...current.community,
              wallPosts: current.community.wallPosts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      upvotes: post.upvotes + (direction === 'up' ? 1 : 0),
                      downvotes: post.downvotes + (direction === 'down' ? 1 : 0),
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
  const [postPhase, setPostPhase] = useState(wallPhases[1].value);
  const [postTopic, setPostTopic] = useState(wallTopics[0]);
  const [composeError, setComposeError] = useState('');
  const [distressPrompt, setDistressPrompt] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);

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

  const publishWallPost = (distressFlag) => {
    onAddPost({
      id: Date.now(),
      author: 'Anonymous NSF',
      phase: postPhase,
      topic: postTopic,
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
      setComposeError(verdict.reason || 'This post was flagged. Please rephrase to keep this a supportive space.');
      return;
    }

    if (verdict.distress && !distressPrompt) {
      // Surface resources before publishing; the writer can still choose to post.
      setDistressPrompt(true);
      return;
    }

    publishWallPost(Boolean(verdict.distress) || distressPrompt);
  };

  const submitReply = (postId) => {
    const draft = (replyDrafts[postId] || '').trim();
    if (!draft || !onReply) return;

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
                  {isWall && post.distressFlag && (
                    <span className="info-badge distress-badge">Support surfaced</span>
                  )}
                </div>
                {feedType === 'wall' && (
                  <h3 className="feed-card-title">{post.title || post.topic}</h3>
                )}
                <p className={expanded ? 'feed-card-body' : 'feed-card-body clamped'}>{post.content}</p>
                {feedType === 'wall' && (
                  <div className="feed-thread-meta">
                    <button
                      type="button"
                      className="thread-stat thread-vote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote?.(post.id, 'up');
                      }}
                    >
                      ▲ {post.upvotes || 0}
                    </button>
                    <button
                      type="button"
                      className="thread-stat thread-vote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote?.(post.id, 'down');
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
              <label>
                <span>Topic</span>
                <select value={postTopic} onChange={(event) => setPostTopic(event.target.value)}>
                  {wallTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
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
              {posting ? 'Checking…' : 'Submit to moderation queue'}
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

    const verdict = await nlpService.moderate(buddyComment.trim());
    setChecking(false);

    if (!verdict.approved) {
      setBlockReason(verdict.reason || 'This note was flagged. Buddy Tap is for sincere welfare concerns only.');
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

  return (
    <section>
      <ScreenHeader
        title="Sentinel"
        subtitle="Private reflection with NLP, or natural language processing, used only to estimate your own emotional trend."
      />
      <StreakCalendar entries={state.journal.entries} streakDays={streakDays} />

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
            {saving ? 'Reflecting…' : 'Submit'}
          </button>
        </div>
        <div className="chart-card sentinel-chart-card">
          <div className="sentinel-chart-head">
            <span className="chart-caption">Your emotional trend — only you can see this.</span>
            {latestScore != null && (
              <span className="sentinel-score-readout">
                <span className="sentinel-score-value">{latestScore}</span>
                <span className="sentinel-score-max">/ 100</span>
              </span>
            )}
          </div>
          <div className="sentinel-chart-canvas">
            <Line options={chartOptions({ yLabel: true, yTicks: true, min: 0, max: 100 })} data={chartData} />
          </div>
          {trendInfo && (
            <p className={`trend-narrative trend-${trendInfo.trend}`}>{trendInfo.narrative}</p>
          )}
          {dipState && !dismissedDip && (
            <div className="trend-banner">
              <div>
                <strong>Your private trend has been low for a few days.</strong>
                <p>Nothing has been shared with anyone. You decide what happens next.</p>
              </div>
              <div className="trend-banner-actions">
                <button className="primary-button small" onClick={() => navigate('/escalation')}>
                  See your options
                </button>
                <button className="soft-button" onClick={() => setDismissedDip(true)}>
                  I'm okay, dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <details className="journal-review-card sentinel-explainer">
        <summary className="sentinel-explainer-summary">
          <div>
            <p className="kicker">User-Controlled Escalation</p>
            <h3>How Sentinel works</h3>
          </div>
          <span className="sentinel-explainer-toggle" aria-hidden>＋</span>
        </summary>
        <div className="sentinel-explainer-body">
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
      </details>
      <div className="journal-review-card">
        <div className="journal-review-header">
          <div>
            <p className="kicker">Review Past Entries</p>
            <h3>Past reflections</h3>
          </div>
          <span className="info-badge">{allReflections.length} saved</span>
        </div>
        {allReflections.length === 0 ? (
          <p className="reflection-empty">No reflections yet. Your first entry will appear here.</p>
        ) : (
          <div className="reflection-list">
            {allReflections.map((item, index) => {
              const score100 = Math.round(entryScore(item) * 100);
              const dominant = item.sentiment?.dominant || dominantFromScore(entryScore(item));
              return (
                <details key={item.id ?? `${entryDay(item)}-${index}`} className="reflection-item">
                  <summary className="reflection-summary">
                    <span className="reflection-date">{shortDate(entryDay(item))}</span>
                    <span className="reflection-summary-meta">
                      <span className={`sentiment-chip sentiment-${dominant}`}>{dominant}</span>
                      <span className="reflection-score">
                        <strong>{score100}</strong>
                        <small>/100</small>
                      </span>
                      <span className="reflection-chevron" aria-hidden>⌄</span>
                    </span>
                  </summary>
                  <div className="reflection-body">
                    {item.prompt && <p className="reflection-prompt">“{item.prompt}”</p>}
                    <p className="reflection-text">{item.text}</p>
                    <div className="reflection-scorebar">
                      <span
                        className={`reflection-scorebar-fill sentiment-${dominant}`}
                        style={{ width: `${score100}%` }}
                      />
                    </div>
                    <p className="reflection-comment">{reflectionComment(item)}</p>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>

      {crisisState && (
        <div className="overlay-alert">
          <div className="alert-card">
            <h2>{crisisResources.title}</h2>
            <p>{crisisResources.message}</p>
            <p>
              Your entry was not saved. These resources are shown only to you — no commander or superior is notified.
            </p>
            <ul className="resource-list">
              {crisisResources.resources.map((resource) => (
                <li key={resource.name}>
                  <strong>{resource.name}</strong>: {resource.number}
                  {resource.hours ? ` · ${resource.hours}` : ''}
                </li>
              ))}
            </ul>
            <div className="action-grid">
              <button className="primary-button small" onClick={() => navigate('/escalation?crisis=true')}>
                Open support options
              </button>
              <button className="soft-button" onClick={() => setCrisisState(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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
