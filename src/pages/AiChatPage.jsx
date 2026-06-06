import { useRef, useState } from 'react';
import { askChatbot } from '../services/mockChatbot';
import { starterQuestions } from '../data';

function renderChatText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line, i) => {
    // Strip any **markdown** the LLM slips through
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="chat-bubble-line">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
        )}
      </p>
    );
  });
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function callChatBackend(question) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: question }),
  });
  if (!response.ok) throw new Error(`Backend ${response.status}`);
  return response.json();
}

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const logRef = useRef(null);

  const appendAssistant = (msg) => {
    setMessages((current) => [...current, { role: 'assistant', ...msg }]);
    setTimeout(() => {
      logRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const sendMessage = async (question) => {
    const prompt = question.trim();
    if (!prompt || loading) return;

    setMessages((current) => [...current, { role: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const result = await callChatBackend(prompt);
      appendAssistant({
        text: result.answer,
        source: result.source,
        matched: result.matched,
      });
    } catch {
      // Backend unavailable — fall back to local mock
      const fallback = askChatbot(prompt);
      appendAssistant({
        text: fallback.answer,
        source: fallback.source,
        matched: fallback.matched,
        isFallback: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <section className="chat-screen">
      <header className="screen-header">
        <p className="kicker">Enlist · Screen 8</p>
        <h1>Ask Anything</h1>
        <p className="chat-source-note">
          Answers sourced exclusively from verified SAF documentation — ns.sg and mindef.gov.sg.
          Questions outside the knowledge base will be flagged.
        </p>
        <div className="rule" />
      </header>

      {messages.length === 0 && (
        <div className="chip-row">
          {starterQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="chip"
              onClick={() => sendMessage(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <div className="chat-log" ref={logRef}>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}>
            <div className={`message-bubble ${message.role}`}>
              <div className="chat-bubble-body">{renderChatText(message.text)}</div>
              {message.role === 'assistant' && message.source && (
                <div className="message-source">{message.source}</div>
              )}
              {message.role === 'assistant' && message.matched === false && !message.isFallback && (
                <div className="message-source fallback">
                  Outside verified knowledge base — visit ns.sg for official guidance.
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-row assistant">
            <div className="message-bubble assistant chat-thinking">
              Retrieving from SAF documentation…
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about enlistment, admin, training, or medical processes"
          disabled={loading}
        />
        <button
          className="primary-button small"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </section>
  );
}
