// src/services/nlpService.js
// The single import surface for real NLP. Components call these — never the LLM directly.
// Talks to the Express backend (which holds the API key). Every call degrades to a safe
// fallback on network/server failure so the app never crashes when the backend is down.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SENTIMENT_FALLBACK = { score: 0.5, crisis: false, dominant: 'neutral' };
const MODERATE_FALLBACK = { approved: true, flagged: false, distress: false, reason: '' };
const COMPANION_FALLBACK = {
  reply:
    "Thanks for sharing that — I'm here with you. What feels like the heaviest part of it right now?",
};

async function postJSON(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} responded ${response.status}`);
  return response.json();
}

// analyze(text) -> { score, crisis, dominant }
export async function analyze(text) {
  try {
    const data = await postJSON('/api/sentiment', { text });
    return {
      score: typeof data.score === 'number' ? data.score : SENTIMENT_FALLBACK.score,
      crisis: Boolean(data.crisis),
      dominant: data.dominant || SENTIMENT_FALLBACK.dominant,
    };
  } catch (err) {
    console.warn('[nlpService.analyze] fallback:', err.message);
    return { ...SENTIMENT_FALLBACK };
  }
}

// moderate(text) -> { approved, flagged, distress, reason }
export async function moderate(text) {
  try {
    const data = await postJSON('/api/moderate', { text });
    return {
      approved: data.approved !== false,
      flagged: Boolean(data.flagged),
      distress: Boolean(data.distress),
      reason: typeof data.reason === 'string' ? data.reason : '',
    };
  } catch (err) {
    console.warn('[nlpService.moderate] fallback:', err.message);
    return { ...MODERATE_FALLBACK };
  }
}

// companion(text, history) -> { reply }
export async function companion(text, history = []) {
  try {
    const data = await postJSON('/api/companion', { text, history });
    return { reply: data.reply || COMPANION_FALLBACK.reply };
  } catch (err) {
    console.warn('[nlpService.companion] fallback:', err.message);
    return { ...COMPANION_FALLBACK };
  }
}

export default { analyze, moderate, companion };
