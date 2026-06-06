import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { peerIntelPosts, intelCategories, intelVocations, intelBatches } from '../data/mockPeerIntel';
import { check as moderationCheck } from '../services/mockModeration';

function getToday() {
  return new Date();
}

function shortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
}

export default function PeerIntelPage() {
  const { intelPosts, addIntelPost } = useAppContext();
  const posts = intelPosts;
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vocationFilter, setVocationFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState('');
  const [modResult, setModResult] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = posts.filter((post) => {
    const catOk = categoryFilter === 'All' || post.category === categoryFilter;
    const vocOk = vocationFilter === 'All' || post.vocation === vocationFilter;
    const batOk = batchFilter === 'All' || post.batch === batchFilter;
    return catOk && vocOk && batOk;
  });

  const handleSubmit = () => {
    if (!draft.trim()) return;

    const result = moderationCheck(draft.trim());
    setModResult(result);

    if (!result.approved) return;

    addIntelPost({
      id: `intel-${Date.now()}`,
      author: 'Anonymous_Fieldnote',
      category: categoryFilter === 'All' ? 'General' : categoryFilter,
      vocation: vocationFilter === 'All' ? 'General' : vocationFilter,
      batch: batchFilter === 'All' ? '26/27' : batchFilter,
      verified: false,
      content: draft.trim(),
      createdAt: getToday().toISOString(),
    });

    setDraft('');
    setModResult(null);
    setShowCompose(false);
  };

  return (
    <section className="feed-screen">
      <header className="screen-header">
        <p className="kicker">Enlist · Screen 9</p>
        <h1>Peer Intel Feed</h1>
        <p>
          Real batch intel from NS veterans organised by vocation so pre-enlistees can learn from
          those who have already gone through it.
        </p>
        <div className="rule" />
      </header>

      <div className="intel-filter-bar">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All Categories</option>
          {intelCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={vocationFilter}
          onChange={(e) => setVocationFilter(e.target.value)}
          aria-label="Filter by vocation"
        >
          <option value="All">All Vocations</option>
          {intelVocations.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          aria-label="Filter by batch"
        >
          <option value="All">All Batches</option>
          {intelBatches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="feed-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No intel found for these filters. Try broadening your search.</div>
        ) : (
          filtered.map((post) => {
            const expanded = post.id === expandedId;
            return (
              <article
                key={post.id}
                className="feed-card"
                onClick={() => setExpandedId(expanded ? null : post.id)}
              >
                <div className="feed-meta">
                  <div>
                    <strong>{post.author}</strong>
                    <span>{shortDate(post.createdAt)}</span>
                  </div>
                  {post.verified && <span className="verified-badge">Verified</span>}
                </div>
                <div className="badge-row">
                  <span className="info-badge">{post.category}</span>
                  {post.vocation && <span className="info-badge">{post.vocation}</span>}
                  {post.batch && <span className="info-badge">{post.batch}</span>}
                </div>
                <p className={expanded ? 'feed-card-body' : 'feed-card-body clamped'}>
                  {post.content}
                </p>
              </article>
            );
          })
        )}
      </div>

      <button className="fab" type="button" onClick={() => setShowCompose(true)} aria-label="Submit intel">
        +
      </button>

      {showCompose && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Submit Anonymous Intel</h3>
              <button type="button" onClick={() => { setShowCompose(false); setModResult(null); setDraft(''); }}>
                Close
              </button>
            </div>
            <p className="intel-modal-note">
              Posts are reviewed before going live. No negative or unverified claims will be
              published.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share what would have helped you know before enlistment."
              rows={6}
            />
            {modResult && !modResult.approved && (
              <p className="mod-warning">{modResult.reason}</p>
            )}
            {modResult && modResult.distress && (
              <div className="distress-resources">
                <p>
                  It sounds like things might be difficult. If you need support before enlistment:
                </p>
                <ul>
                  <li>SAF Care Line: 1800-278-0033 (24 hrs)</li>
                  <li>Samaritans of Singapore: 1767</li>
                </ul>
              </div>
            )}
            <button className="primary-button" onClick={handleSubmit}>
              Submit to moderation queue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
