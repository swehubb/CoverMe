// src/services/nlpService.js
// The single import surface for real NLP. Components call these — never the LLM directly.
// Talks to the Express backend (which holds the API key). Every call degrades to a safe
// fallback on network/server failure so the app never crashes when the backend is down.

import { explicitCrisisWords } from '../data/utils/sentimentKeywords.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Local crisis safety net — only unambiguous self-harm phrasing is caught here,
// so explicit language is still flagged if the backend is unreachable, while
// ambiguous Singlish hyperbole is left to the model (see explicitCrisisWords).
function detectCrisis(text) {
  const lower = (text || '').toLowerCase();
  return explicitCrisisWords.some((phrase) => lower.includes(phrase));
}

const SENTIMENT_FALLBACK = { score: 0.5, crisis: false, dominant: 'neutral' };
const MODERATE_FALLBACK = { approved: true, flagged: false, distress: false, reason: '' };
const COMPANION_FALLBACK = {
  reply:
    "Thanks for sharing that — I'm here with you. What feels like the heaviest part of it right now?",
};
const TREND_FALLBACK = { narrative: 'Your recent entries show a mixed picture.', trend: 'stable' };

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
    const crisis = Boolean(data.crisis) || detectCrisis(text);
    return {
      score: crisis ? 0.05 : typeof data.score === 'number' ? data.score : SENTIMENT_FALLBACK.score,
      crisis,
      dominant: crisis ? 'crisis' : data.dominant || SENTIMENT_FALLBACK.dominant,
    };
  } catch (err) {
    console.warn('[nlpService.analyze] fallback:', err.message);
    if (detectCrisis(text)) return { score: 0.05, crisis: true, dominant: 'crisis' };
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

// moderateBuddy(text) -> { approved, flagged, distress, reason }
// Stricter than moderate() — only approves genuine welfare concerns, not grievances or dislikes.
export async function moderateBuddy(text) {
  try {
    const data = await postJSON('/api/moderate', { text, context: 'buddy' });
    return {
      approved: data.approved !== false,
      flagged: Boolean(data.flagged),
      distress: Boolean(data.distress),
      reason: typeof data.reason === 'string' ? data.reason : '',
    };
  } catch (err) {
    console.warn('[nlpService.moderateBuddy] fallback:', err.message);
    return { ...MODERATE_FALLBACK };
  }
}

// companion(message, history) -> { reply }
// history is the full prior conversation: [{ role: 'user'|'assistant', content }].
export async function companion(message, history = []) {
  try {
    const data = await postJSON('/api/companion', { message, history });
    return { reply: data.reply || COMPANION_FALLBACK.reply };
  } catch (err) {
    console.warn('[nlpService.companion] fallback:', err.message);
    return { ...COMPANION_FALLBACK };
  }
}

// trendNarrative(scores) -> { narrative, trend }
// scores: chronological sentiment scores, most recent last (3–7 used).
export async function trendNarrative(scores) {
  try {
    const data = await postJSON('/api/trend-narrative', { scores });
    return {
      narrative: data.narrative || TREND_FALLBACK.narrative,
      trend: data.trend || TREND_FALLBACK.trend,
    };
  } catch (err) {
    console.warn('[nlpService.trendNarrative] fallback:', err.message);
    return { ...TREND_FALLBACK };
  }
}

// getWeekendPlan({ pesStatus, vocation, ipptGoal, currentScore, currentAward, attempts, swimAttempts })
// -> { ippt: { summary, days }, swim: { summary, days } } | null on failure
export async function getWeekendPlan(payload) {
  try {
    const data = await postJSON('/api/weekend-plan', payload);
    if (!data?.ippt?.days?.length || !data?.swim?.days?.length) throw new Error('Invalid shape');
    return data;
  } catch (err) {
    console.warn('[nlpService.getWeekendPlan] fallback:', err.message);
    return null;
  }
}

// recommendWorkout({ pes, goal, intake, recentLogs }) -> { useDefault: false, days } | { useDefault: true }
// intake: baseline + preferences ({ pushups, situps, runMmss, sessionMinutes, daysPerWeek }).
// recentLogs: up to the last 5 completed sessions. Always resolves — never throws —
// so the workout screen can fall back to the local PES default template on any failure.
export async function recommendWorkout({ pes, goal, intake = null, recentLogs = [] }) {
  try {
    const data = await postJSON('/api/recommend-workout', { pes, goal, intake, recentLogs });
    if (data?.useDefault || !data?.days) return { useDefault: true };
    return { useDefault: false, days: data.days };
  } catch (err) {
    console.warn('[nlpService.recommendWorkout] fallback:', err.message);
    return { useDefault: true };
  }
}

export default { analyze, moderate, moderateBuddy, companion, trendNarrative, getWeekendPlan, recommendWorkout };
