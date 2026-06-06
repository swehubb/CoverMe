import { useState } from 'react';
import { peerIntelPosts, intelCategories, intelVocations, intelBatches } from '../data/mockPeerIntel';

function shortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
}

export default function PeerIntelPage({ state }) {
  const posts = state.community.intelPosts;
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vocationFilter, setVocationFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = posts.filter((post) => {
    const catOk = categoryFilter === 'All' || post.category === categoryFilter;
    const vocOk = vocationFilter === 'All' || post.vocation === vocationFilter;
    const batOk = batchFilter === 'All' || post.batch === batchFilter;
    return catOk && vocOk && batOk;
  });

  return (
    <section className="feed-screen">
      <div style={{ marginBottom: 24 }}>
        <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · PEER INTEL</div>
        <h1 className="h-display" style={{ fontSize: 52, marginBottom: 6 }}>PEER INTEL FEED</h1>
        <p style={{ color: 'var(--text-dim)' }}>
          Verified experiences from NS veterans, organised by vocation and intake batch. Read-only
          — contributions come from those who have completed the journey.
        </p>
      </div>

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
          <div className="empty-state">
            No intel found for these filters. Try broadening your search.
          </div>
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
    </section>
  );
}
