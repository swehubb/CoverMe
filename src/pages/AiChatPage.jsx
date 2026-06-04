import { useState } from 'react';
import { askChatbot } from '../services/mockChatbot';
import { starterQuestions } from '../data';

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = (question) => {
    const prompt = question.trim();
    if (!prompt) return;

    const result = askChatbot(prompt);
    setMessages((current) => [
      ...current,
      { role: 'user', text: prompt },
      {
        role: 'assistant',
        text: result.answer,
        source: result.source,
        matched: result.matched,
      },
    ]);
    setInput('');
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
          All answers sourced exclusively from verified SAF documentation.
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

      <div className="chat-log">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}>
            <div className={`message-bubble ${message.role}`}>
              {message.text}
              {message.role === 'assistant' && message.source && (
                <div className="message-source">Source: {message.source}</div>
              )}
              {message.role === 'assistant' && !message.matched && (
                <div className="message-source fallback">
                  This query is outside the verified knowledge base.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about enlistment, admin, training, or medical processes"
        />
        <button className="primary-button small" onClick={() => sendMessage(input)}>
          Send
        </button>
      </div>
    </section>
  );
}
