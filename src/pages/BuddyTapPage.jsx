import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { buddyTapSelectableMembers } from '../data/mockPlatoon';
import nlpService from '../services/nlpService';
import { notify } from '../services/mockNotification';
import { Modal, ScreenHeader } from './shared/AppScreenPrimitives';

export default function BuddyTapPage() {
  const { buddyTaps, addBuddyTap } = useAppContext();
  const [buddyId, setBuddyId] = useState(buddyTapSelectableMembers[0].id);
  const [buddyComment, setBuddyComment] = useState('');
  const [submittedConcern, setSubmittedConcern] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [thresholdNotice, setThresholdNotice] = useState(null);

  const taps = buddyTaps || [];
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

    const member = buddyTapSelectableMembers.find((item) => item.id === buddyId);
    const priorCount = taps.filter((tap) => tap.toUserId === buddyId).length;
    const newCount = priorCount + 1;

    addBuddyTap({ id: Date.now(), toUserId: buddyId, text: buddyComment.trim(), timestamp: new Date().toISOString() });

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
