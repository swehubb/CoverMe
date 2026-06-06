import { useState } from 'react';
import { platoonMembers } from '../data/mockPlatoon';
import { useAppContext } from '../contexts/AppContext';

// Spec assumes mockPlatoon has {activity, score, date, award} per member.
// Actual shape is {id, name, rank, section, role, pes}. Activity comes from trainingFeed.
// TODO: update when mockPlatoon.js is extended with per-member activity/score/award fields.

const USER_SECTION = '1'; // TODO: derive from AuthContext.user when platoon membership is linked

const FILTERS = ['Section', 'Platoon', 'Company'];

function extractName(memberName) {
  // "CPL Lim Jun Jie" → "Lim Jun Jie"
  const parts = memberName.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : memberName;
}

function getMemberSection(memberName) {
  const name = extractName(memberName);
  const found = platoonMembers.find((m) => m.name === name);
  return found?.section ?? null;
}

export default function PlatoonFeed() {
  const { trainingFeed } = useAppContext();
  const [activeFilter, setActiveFilter] = useState('Platoon');

  const filtered = trainingFeed.filter((entry) => {
    if (activeFilter === 'Section') {
      return getMemberSection(entry.memberName) === USER_SECTION;
    }
    return true; // Platoon and Company show all
  });

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Serve · Community</p>
        <h1>Unit Training Activity</h1>
        <div className="rule" />
      </header>

      {/* Filter bar */}
      <div className="filter-bar" style={{ marginBottom: '14px' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="chip"
            style={{
              flex: 1,
              background: activeFilter === f ? 'var(--surface-accent)' : undefined,
              borderColor: activeFilter === f ? 'var(--accent)' : undefined,
            }}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed list */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '28px', textAlign: 'center' }}>
          <p>No training activity recorded in this {activeFilter.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="feed-list feed-list-full">
          {filtered.map((entry) => {
            const section = getMemberSection(entry.memberName);
            const dateStr = entry.timestamp
              ? new Date(entry.timestamp).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
              : '—';
            return (
              <article key={entry.id} className="feed-card">
                <div className="feed-meta">
                  <strong>{entry.memberName}</strong>
                  <span>{dateStr}</span>
                </div>
                <p className="feed-card-title">{entry.type}</p>
                <p>{entry.detail}</p>
                {section && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="activity-chip">Section {section}</span>
                  </div>
                )}
                {/* TODO: show score + award badge when mockPlatoon includes activity/score/award */}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
