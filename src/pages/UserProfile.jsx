import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { calculateORD } from '../utils/ordCalculator';

// TODO: AppContext does not yet expose journalStreak — defaulting to 0 until added.
// TODO: AppContext does not yet expose clearJournalData() — PDPA delete is a no-op stub.
// TODO: IPPT goal lives on AuthContext.user; updating via updateUser. If it should live
//       elsewhere, move the handler to whichever context owns it.

const GOAL_OPTIONS = [
  { value: 'pass',   label: 'Pass (51+)'   },
  { value: 'silver', label: 'Silver (75+)' },
  { value: 'gold',   label: 'Gold (85+)'   },
];

export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();
  const { ipptLogs } = useAppContext();

  // TODO: replace with useAppContext().journalStreak when implemented
  const journalStreak = 0;

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!user) {
    return <p className="kicker">Loading... faster than your 2.4km.</p>;
  }

  const enlistmentDate = user.enlistmentDate ?? '2026-05-01';
  const { daysToORD }  = calculateORD(enlistmentDate);

  const ordDisplay = user.ordDate
    ? new Date(user.ordDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })
    : (() => {
        const d = new Date(enlistmentDate);
        d.setMonth(d.getMonth() + 24);
        return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
      })();

  const enlistDisplay = new Date(enlistmentDate).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const currentGoal = (user.ipptGoal || 'pass').toLowerCase();

  function handleGoalChange(e) {
    updateUser((u) => ({ ...u, ipptGoal: e.target.value }));
  }

  function handleDeleteConfirm() {
    // TODO: call AppContext.clearJournalData() once the function is implemented.
    setShowDeleteModal(false);
  }

  function handleSignOut() {
    localStorage.removeItem('cover-me-state');
    logout();
    window.location.href = '/login';
  }

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Module 2 · Serve</p>
        <h1>Profile</h1>
        <div className="rule" />
      </header>

      {/* Profile header */}
      <div className="profile-card profile-hero-card" style={{ marginBottom: '12px' }}>
        <p className="kicker">Service profile</p>
        <h2>{user.rank ?? 'REC'} {user.name ?? user.fullName ?? '—'}</h2>
        <p className="profile-hero-meta">{user.unit ?? '—'}</p>
      </div>

      {/* Details */}
      <div className="profile-card" style={{ marginBottom: '12px' }}>
        <p className="kicker">Details</p>
        <div className="profile-grid">
          <div className="profile-line">
            <span className="muted-text">PES Status</span>
            <span>{user.pes ?? user.pesStatus ?? '—'}</span>
          </div>
          <div className="profile-line">
            <span className="muted-text">Enlistment</span>
            <span>{enlistDisplay}</span>
          </div>
          <div className="profile-line">
            <span className="muted-text">ORD (est.)</span>
            <span>{ordDisplay}</span>
          </div>
          <div className="profile-line">
            <span className="muted-text">IPPT Goal</span>
            <span>
              <select
                value={currentGoal}
                onChange={handleGoalChange}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface-primary)',
                  color: 'var(--text-primary)',
                  padding: '4px 8px',
                  fontSize: '0.9rem',
                }}
              >
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stat-row" style={{ marginBottom: '16px' }}>
        <div className="profile-stat">
          <span>Journal Streak</span>
          <strong>{journalStreak} days</strong>
        </div>
        <div className="profile-stat">
          <span>IPPT Attempts</span>
          <strong>{ipptLogs.length}</strong>
        </div>
        <div className="profile-stat">
          <span>ORD In</span>
          <strong>{daysToORD}d</strong>
        </div>
      </div>

      {/* PDPA */}
      <button type="button" className="secondary-button" onClick={() => setShowDeleteModal(true)}>
        Delete All Journal Data
      </button>

      {/* Sign out */}
      <button type="button" className="primary-button" style={{ marginTop: '8px' }} onClick={handleSignOut}>
        Sign Out
      </button>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete journal data?</h3>
              <button type="button" onClick={() => setShowDeleteModal(false)}>x</button>
            </div>
            <p>This permanently deletes all your journal entries and cannot be undone.</p>
            <button type="button" className="primary-button" onClick={handleDeleteConfirm}>
              Confirm Delete
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
