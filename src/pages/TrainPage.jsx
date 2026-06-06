import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Modal, ScreenHeader, StatBlock } from './shared/AppScreenPrimitives';
import {
  calculateIpptScore,
  chartOptions,
  formatRunTime,
  getInitials,
  getPbs,
  shortDate,
  toSeconds,
  toTitleCase,
} from './shared/appScreenUtils';

export default function TrainPage({ state, activeModule }) {
  const { ipptGoal, ipptLogs, addIPPTLog, trainingFeed, setTrainingFeed } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ pushups: '', situps: '', runTime: '12:30', date: '2026-05-20' });
  const [postForm, setPostForm] = useState({ headline: '', detail: '', statline: '', tag: 'IPPT' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const attempts = ipptLogs;
  const activityFeed = trainingFeed;
  const pbs = getPbs(attempts);
  const projected = calculateIpptScore(
    Number(form.pushups || pbs.pushups),
    Number(form.situps || pbs.situps),
    form.runTime ? toSeconds(form.runTime) : pbs.runSeconds,
  );

  const submitAttempt = () => {
    const runSeconds = toSeconds(form.runTime);
    if (!form.pushups || !form.situps || !runSeconds) return;

    addIPPTLog({
      date: form.date,
      pushups: Number(form.pushups),
      situps: Number(form.situps),
      runSeconds,
    });

    setShowModal(false);
  };

  const chartData = {
    labels: attempts.map((attempt) => shortDate(attempt.date)),
    datasets: [
      {
        data: attempts.map((attempt) => calculateIpptScore(attempt.pushups, attempt.situps, attempt.runSeconds).score),
        borderColor: '#4A7C59',
        backgroundColor: 'rgba(74, 124, 89, 0.14)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const publishPost = () => {
    if (!postForm.headline.trim() || !postForm.detail.trim()) return;

    setTrainingFeed((current) => [
      {
        id: Date.now(),
        name: toTitleCase(state.auth.profile.fullName),
        unit: state.auth.profile.unit || 'NS Unit',
        recency: 'Just now',
        headline: postForm.headline.trim(),
        statline: postForm.statline.trim() || `${projected.score} pts`,
        detail: postForm.detail.trim(),
        chips: [postForm.tag, 'New Post'],
        reactions: { cheer: 0, fire: 0, respect: 0 },
        userReaction: '',
        comments: [],
      },
      ...current,
    ]);

    setPostForm({ headline: '', detail: '', statline: '', tag: 'IPPT' });
  };

  const toggleReaction = (activityId, reactionType) => {
    setTrainingFeed((current) =>
      current.map((item) => {
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
    );
  };

  const submitComment = (activityId) => {
    const draft = (commentDrafts[activityId] || '').trim();
    if (!draft) return;

    setTrainingFeed((current) =>
      current.map((item) =>
        item.id === activityId
          ? {
              ...item,
              comments: [
                ...item.comments,
                {
                  id: Date.now(),
                  author: toTitleCase(state.auth.profile.fullName),
                  text: draft,
                  recency: 'Just now',
                },
              ],
            }
          : item,
      ),
    );

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
      <div className="goal-banner">{ipptGoal || state.onboarding.ipptGoal} target</div>
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
          <input type="number" placeholder="Push-ups" value={form.pushups} onChange={(event) => setForm({ ...form, pushups: event.target.value })} />
          <input type="number" placeholder="Sit-ups" value={form.situps} onChange={(event) => setForm({ ...form, situps: event.target.value })} />
          <input type="text" placeholder="MM:SS" value={form.runTime} onChange={(event) => setForm({ ...form, runTime: event.target.value })} />
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
            <input type="text" placeholder="Headline" value={postForm.headline} onChange={(event) => setPostForm({ ...postForm, headline: event.target.value })} />
            <input type="text" placeholder="Stat line" value={postForm.statline} onChange={(event) => setPostForm({ ...postForm, statline: event.target.value })} />
            <select value={postForm.tag} onChange={(event) => setPostForm({ ...postForm, tag: event.target.value })}>
              <option>IPPT</option>
              <option>2.4km</option>
              <option>Push-ups</option>
              <option>Sit-ups</option>
              <option>Recovery</option>
            </select>
          </div>
          <textarea value={postForm.detail} onChange={(event) => setPostForm({ ...postForm, detail: event.target.value })} placeholder="What changed, what worked, or what you are proud of." rows={3} />
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
            <input type="number" placeholder="Push-up reps" value={form.pushups} onChange={(event) => setForm({ ...form, pushups: event.target.value })} />
            <input type="number" placeholder="Sit-up reps" value={form.situps} onChange={(event) => setForm({ ...form, situps: event.target.value })} />
            <input type="text" placeholder="2.4km MM:SS" value={form.runTime} onChange={(event) => setForm({ ...form, runTime: event.target.value })} />
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
