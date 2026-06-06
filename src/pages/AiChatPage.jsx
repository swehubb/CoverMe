import { useRef, useState } from 'react';
import { askChatbot } from '../services/mockChatbot';
import { starterQuestions } from '../data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function callBackend(question) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: question }),
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json();
}

function renderText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="chat-bubble-line">
        {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
      </p>
    );
  });
}

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const logRef = useRef(null);

  const addMsg = (msg) => {
    setMessages((c) => [...c, msg]);
    setTimeout(() => logRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };

  const sendMessage = async (question) => {
    const prompt = question.trim();
    if (!prompt || loading) return;
    setMessages((c) => [...c, { role: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const result = await callBackend(prompt);
      addMsg({ role: 'assistant', text: result.answer, source: result.source, matched: result.matched });
    } catch {
      const fallback = askChatbot(prompt);
      addMsg({ role: 'assistant', text: fallback.answer, source: fallback.source, matched: fallback.matched });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · KNOWLEDGE BASE</div>
      <h1 className="h-display" style={{ fontSize: 52, marginBottom: 6 }}>ASK ANYTHING</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 20, fontSize: 14 }}>
        All answers sourced exclusively from verified SAF documentation — ns.sg and mindef.gov.sg.
        Questions outside the knowledge base will be flagged.
      </p>

      {messages.length === 0 && (
        <div className="chat-starter-chips">
          {starterQuestions.map((q) => (
            <button key={q} className="chat-chip" onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>
      )}

      <div className="chat-log" ref={logRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-row ${msg.role}`}>
            <div className={`chat-bubble ${msg.role}`}>
              <div className="chat-bubble-body">{renderText(msg.text)}</div>
              {msg.role === 'assistant' && msg.source && (
                <div className="chat-source">Source: {msg.source}</div>
              )}
              {msg.role === 'assistant' && msg.matched === false && (
                <div className="chat-source fallback">Outside verified knowledge base — visit ns.sg.</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-row assistant">
            <div className="chat-bubble assistant chat-thinking">Retrieving from SAF documentation…</div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Ask about enlistment, admin, training, or medical processes"
          disabled={loading}
        />
        <button className="btn sm" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
          {loading ? '…' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
