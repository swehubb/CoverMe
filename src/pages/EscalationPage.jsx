import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import nlpService from '../services/nlpService';
import { crisisResources } from '../services/mockNotification';
import { Modal, ScreenHeader } from './shared/AppScreenPrimitives';
import { chartOptions, entryDay, entryScore, shortDate } from './shared/appScreenUtils';

export default function EscalationPage({ state }) {
  const { journalEntries } = useAppContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCrisis = params.get('crisis') === 'true';
  const [acknowledged, setAcknowledged] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [peerSent, setPeerSent] = useState(false);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const entries = journalEntries.slice(-7);
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

      <div className="chart-card">
        <div className="chart-caption">Your last 7 days — only you can see this.</div>
        <Line options={chartOptions({ yLabel: false, yTicks: false, min: 0.2, max: 0.95 })} data={chartData} />
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
                  <p className="companion-hint">Share whatever&apos;s on your mind. There&apos;s no wrong way to start.</p>
                )}
                {history.map((message, index) => (
                  <div key={index} className={`companion-bubble ${message.role}`}>
                    {message.content}
                  </div>
                ))}
                {thinking && <div className="companion-bubble assistant">…</div>}
              </div>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write to your companion…" rows={3} />
              <button className="primary-button small" onClick={sendToCompanion} disabled={thinking}>
                {thinking ? 'Reflecting…' : 'Send'}
              </button>
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
          <h3>I&apos;m okay for now</h3>
          <p>Head back to your journal. This stays here if you need it later.</p>
          <button className="soft-button" onClick={() => navigate('/journal')}>
            Back to journal
          </button>
        </article>
      </div>

      {peerSent && (
        <Modal title="Request sent" onClose={() => setPeerSent(false)}>
          <p>
            An anonymous request has been sent to your unit&apos;s peer support leader. Your identity is not attached —
            they&apos;ll simply know someone reached out and is open to a chat.
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
