import { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import mockEnlistmentInfo from '../data/mockEnlistmentInfo';
import { journalPrompts } from '../data/mockJournal';
import { buddyTapSelectableMembers } from '../data/mockPlatoon';
import { intelCategories } from '../data/mockPeerIntel';
import { wallTopics } from '../data/mockPeerWall';

function FitnessPrepPanel() {
  const { ipptLogs, addIPPTLog } = useAppContext();
  const [form, setForm] = useState({ date: '', pushUps: '', sitUps: '', runTime: '', totalScore: '' });
  const chartData = useMemo(
    () => [...ipptLogs].reverse().map((log) => ({ label: log.label || log.date, score: Number(log.totalScore) || 0 })),
    [ipptLogs],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    addIPPTLog({
      ...form,
      label: form.date,
      pushUps: Number(form.pushUps),
      sitUps: Number(form.sitUps),
      totalScore: Number(form.totalScore),
    });
    setForm({ date: '', pushUps: '', sitUps: '', runTime: '', totalScore: '' });
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="section-label">IPPT Trend</div>
        <div className="chart-shell" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" stroke="#5c665e" />
              <YAxis stroke="#5c665e" domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2d4a3e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card">
        <div className="section-label">Add IPPT Log</div>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="ippt-date">Date</label>
              <input id="ippt-date" className="input" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label htmlFor="ippt-run-time">Run Time</label>
              <input id="ippt-run-time" className="input" placeholder="11:30" value={form.runTime} onChange={(event) => setForm((current) => ({ ...current, runTime: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label htmlFor="ippt-pushups">Push-ups</label>
              <input id="ippt-pushups" className="input" type="number" value={form.pushUps} onChange={(event) => setForm((current) => ({ ...current, pushUps: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label htmlFor="ippt-situps">Sit-ups</label>
              <input id="ippt-situps" className="input" type="number" value={form.sitUps} onChange={(event) => setForm((current) => ({ ...current, sitUps: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label htmlFor="ippt-score">Total Score</label>
              <input id="ippt-score" className="input" type="number" value={form.totalScore} onChange={(event) => setForm((current) => ({ ...current, totalScore: event.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="button-primary">Add Log</button>
        </form>
      </section>
    </div>
  );
}

function JournalPanel() {
  const { journalEntries, addJournalEntry } = useAppContext();
  const [prompt, setPrompt] = useState(journalPrompts[0]);
  const [text, setText] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    addJournalEntry({ date: new Date().toISOString().slice(0, 10), prompt, text });
    setText('');
  };

  return (
    <div className="grid-2">
      <section className="card">
        <div className="section-label">Add Journal Entry</div>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="journal-prompt">Prompt</label>
            <select id="journal-prompt" className="select" value={prompt} onChange={(event) => setPrompt(event.target.value)}>
              {journalPrompts.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="journal-text">Reflection</label>
            <textarea id="journal-text" className="textarea" value={text} onChange={(event) => setText(event.target.value)} required />
          </div>
          <button type="submit" className="button-primary">Save Entry</button>
        </form>
      </section>
      <section className="card">
        <div className="section-label">Recent Entries</div>
        <div className="post-list">
          {journalEntries.slice(0, 4).map((entry) => (
            <article key={entry.id} className="post-item">
              <div className="post-meta">
                <span className="stat-chip">{entry.date}</span>
              </div>
              <strong>{entry.prompt}</strong>
              <p className="card-copy">{entry.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BuddyTapPanel() {
  const { buddyTaps, addBuddyTap } = useAppContext();
  const [memberId, setMemberId] = useState(buddyTapSelectableMembers[0]?.id || '');
  const [reason, setReason] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const member = buddyTapSelectableMembers.find((item) => item.id === memberId);
    addBuddyTap({ memberId, memberName: member?.name || 'Unknown', reason, createdAt: new Date().toISOString() });
    setReason('');
  };

  return (
    <div className="grid-2">
      <section className="card">
        <div className="section-label">Add Buddy Tap</div>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="buddy-member">Platoon Member</label>
            <select id="buddy-member" className="select" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
              {buddyTapSelectableMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.rank} {member.name}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="buddy-reason">Concern</label>
            <textarea id="buddy-reason" className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} required />
          </div>
          <button type="submit" className="button-primary">Send Buddy Tap</button>
        </form>
      </section>
      <section className="card">
        <div className="section-label">Recent Taps</div>
        <div className="post-list">
          {buddyTaps.slice(0, 4).map((tap) => (
            <article key={tap.id} className="post-item">
              <div className="post-meta">
                <span className="stat-chip">{tap.memberName}</span>
                <span className="stat-chip">{tap.createdAt.slice(0, 10)}</span>
              </div>
              <p className="card-copy">{tap.reason}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function WallPanel() {
  const { wallPosts, addWallPost } = useAppContext();
  const [topic, setTopic] = useState(wallTopics[0]);
  const [content, setContent] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    addWallPost({ author: 'Demo User', topic, content, createdAt: new Date().toISOString() });
    setContent('');
  };

  return (
    <div className="grid-2">
      <section className="card">
        <div className="section-label">Add Wall Post</div>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="wall-topic">Topic</label>
            <select id="wall-topic" className="select" value={topic} onChange={(event) => setTopic(event.target.value)}>
              {wallTopics.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="wall-content">Post</label>
            <textarea id="wall-content" className="textarea" value={content} onChange={(event) => setContent(event.target.value)} required />
          </div>
          <button type="submit" className="button-primary">Publish Post</button>
        </form>
      </section>
      <section className="card">
        <div className="section-label">Recent Posts</div>
        <div className="post-list">
          {wallPosts.slice(0, 4).map((post) => (
            <article key={post.id} className="post-item">
              <div className="post-meta">
                <span className="stat-chip">{post.topic}</span>
                <span className="stat-chip">{post.createdAt.slice(0, 10)}</span>
              </div>
              <strong>{post.author}</strong>
              <p className="card-copy">{post.content}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function IntelPanel() {
  const { intelPosts, addIntelPost } = useAppContext();
  const [category, setCategory] = useState(intelCategories[0]);
  const [content, setContent] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    addIntelPost({ author: 'Demo Veteran', category, content, createdAt: new Date().toISOString() });
    setContent('');
  };

  return (
    <div className="grid-2">
      <section className="card">
        <div className="section-label">Add Intel Post</div>
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="intel-category">Category</label>
            <select id="intel-category" className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {intelCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="intel-content">Advice</label>
            <textarea id="intel-content" className="textarea" value={content} onChange={(event) => setContent(event.target.value)} required />
          </div>
          <button type="submit" className="button-primary">Save Intel</button>
        </form>
      </section>
      <section className="card">
        <div className="section-label">Recent Intel</div>
        <div className="post-list">
          {intelPosts.slice(0, 4).map((post) => (
            <article key={post.id} className="post-item">
              <div className="post-meta">
                <span className="stat-chip">{post.category}</span>
                <span className="stat-chip">{post.createdAt.slice(0, 10)}</span>
              </div>
              <strong>{post.author}</strong>
              <p className="card-copy">{post.content}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunityPanel() {
  const { wallPosts, intelPosts, buddyTaps } = useAppContext();

  return (
    <section className="metric-grid">
      <div className="card metric-card">
        <div className="metric-label">Wall Posts</div>
        <div className="metric-value">{wallPosts.length}</div>
      </div>
      <div className="card metric-card">
        <div className="metric-label">Intel Posts</div>
        <div className="metric-value">{intelPosts.length}</div>
      </div>
      <div className="card metric-card">
        <div className="metric-label">Buddy Taps</div>
        <div className="metric-value">{buddyTaps.length}</div>
      </div>
      <div className="card metric-card">
        <div className="metric-label">Shared Context</div>
        <div className="metric-value">Live</div>
      </div>
    </section>
  );
}

function TrainPanel() {
  const { trainingFeed } = useAppContext();

  return (
    <section className="card">
      <div className="section-label">Training Feed</div>
      <div className="post-list">
        {trainingFeed.map((item) => (
          <article key={item.id} className="post-item">
            <div className="post-line">
              <strong>{item.memberName}</strong>
              <span className="stat-chip">{item.type}</span>
            </div>
            <p className="card-copy">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhatToExpectPanel() {
  return (
    <section className="card">
      <div className="section-label">Enlistment Notes</div>
      <div className="simple-list">
        {mockEnlistmentInfo.map((item) => (
          <article key={item.id} className="simple-item">
            <strong>{item.title}</strong>
            <p className="card-copy">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WeekendPlannerPanel() {
  return (
    <section className="card">
      <div className="section-label">Weekend Planner</div>
      <ul className="detail-list">
        <li>Saturday morning run or brisk walk</li>
        <li>One focused strength block for push-ups and core</li>
        <li>One admin reset task before book-in</li>
      </ul>
    </section>
  );
}

function AiChatPanel() {
  return (
    <section className="card">
      <div className="section-label">AI Chat Placeholder</div>
      <p className="card-copy">
        This route is wired and themed, but left intentionally light so the scaffold stays within your checklist.
      </p>
    </section>
  );
}

const featurePanels = {
  'fitness-prep': FitnessPrepPanel,
  journal: JournalPanel,
  'buddy-tap': BuddyTapPanel,
  'peer-support': WallPanel,
  'peer-intel': IntelPanel,
  community: CommunityPanel,
  train: TrainPanel,
  'what-to-expect': WhatToExpectPanel,
  'weekend-planner': WeekendPlannerPanel,
  'ai-chat': AiChatPanel,
};

export default function FeaturePage({ featureKey, title, module }) {
  const Panel = featurePanels[featureKey];
  const { currentModule } = useAuth();

  return (
    <PageWrapper title={title} description="Shared route shell backed by the new layout and context structure." module={module || currentModule}>
      <Panel />
    </PageWrapper>
  );
}
