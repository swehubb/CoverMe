import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import nlpService from '../services/nlpService';
import { crisisResources } from '../services/mockNotification';
import { wellnessPrompts } from '../data';
import { ScreenHeader } from './shared/AppScreenPrimitives';
import {
  chartOptions,
  dominantFromScore,
  entryDay,
  entryScore,
  getJournalStreak,
  getToday,
  isTrendDeclining,
  shortDate,
} from './shared/appScreenUtils';

export default function JournalPage({ state }) {
  const { consented, journalEntries, addJournalEntry } = useAppContext();
  const navigate = useNavigate();
  const [entry, setEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [crisisState, setCrisisState] = useState(false);
  const [dismissedDip, setDismissedDip] = useState(false);
  const prompt = wellnessPrompts[getToday().getDate() % wellnessPrompts.length];
  const entries = journalEntries.slice(-14);
  const reviewEntries = [...journalEntries].slice(-5).reverse();
  const streakDays = getJournalStreak(journalEntries);
  const dipState = isTrendDeclining(entries);

  if (!(consented || state.onboarding.consented)) {
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
      setCrisisState(true);
      setSaving(false);
      return;
    }

    addJournalEntry({
      timestamp: new Date().toISOString(),
      text: entry.trim(),
      sentiment: result,
      prompt,
    });

    setEntry('');
    setSaving(false);
  };

  const chartData = {
    labels: entries.map((item) => shortDate(entryDay(item))),
    datasets: [
      {
        data: entries.map((item) => entryScore(item)),
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
          <textarea value={entry} onChange={(event) => setEntry(event.target.value)} placeholder="Write freely. This space is private." rows={7} />
          <button className="primary-button" onClick={submitEntry} disabled={saving}>
            {saving ? 'Reflecting…' : 'Submit'}
          </button>
        </div>
        <div className="chart-card">
          <div className="chart-caption">Your emotional trend - only you can see this.</div>
          <Line options={chartOptions({ yLabel: false, yTicks: false, min: 0.2, max: 0.95 })} data={chartData} />
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
            <article key={item.id ?? `${entryDay(item)}-${index}`} className="journal-review-item">
              <div className="journal-review-topline">
                <strong>{shortDate(entryDay(item))}</strong>
                <span className={`sentiment-chip sentiment-${item.sentiment?.dominant || dominantFromScore(entryScore(item))}`}>
                  {item.sentiment?.dominant || dominantFromScore(entryScore(item))}
                </span>
              </div>
              <p>{item.text.length > 80 ? `${item.text.slice(0, 80)}…` : item.text}</p>
            </article>
          ))}
        </div>
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
