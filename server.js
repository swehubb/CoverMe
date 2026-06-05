// server.js — Cover Me / Sentinel NLP backend
// Mirrors the production shape: React -> this API -> hosted LLM (stands in for AWS Bedrock).
// The OpenAI API key lives here, server-side only, and is never sent to the frontend.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SENTIMENT_SYSTEM = `You are a sentiment analysis engine for a mental health journaling app used by Singapore National Servicemen. Analyse the journal entry and return ONLY valid JSON with no preamble, no markdown, no backticks. Schema: { score: number between 0 and 1 where 0 is extremely negative and 1 is extremely positive, crisis: boolean true only if the text contains explicit self-harm or suicidal ideation, dominant: one of positive|neutral|negative|crisis }. Be sensitive to Singlish and Singapore military slang. Understatement is common — 'sian' means drained/fed up, 'song' means great, 'jialat' means terrible situation, 'shiok' means feels good, 'tahan' means endure/cope. A crisis flag must only be true for explicit self-harm language, not general sadness.`;

const MODERATE_SYSTEM = `You are a content moderation engine for a peer support platform used by Singapore National Servicemen. Analyse the text and return ONLY valid JSON with no preamble, no markdown, no backticks. Schema: { approved: boolean, flagged: boolean, distress: boolean, reason: string }. approved is false if text contains: targeted harassment, doxxing (NRIC numbers in format S/T/F/G + 7 digits + letter), explicit threats, spam. flagged is true for borderline content. distress is true if the writer appears to be in emotional distress or mentions self-harm. reason is a short human-readable explanation or empty string if approved.`;

const COMPANION_SYSTEM = `You are a compassionate AI journalling companion for a Singapore NSman. Respond warmly and briefly (2–3 sentences). Ask one gentle follow-up question. Never diagnose. Never give medical advice. If the person expresses crisis-level distress, gently but firmly direct them to SAF counselling at 1800-278-0022 or SOS at 1-767. Be aware of Singlish.`;

// ---------------------------------------------------------------------------
// Fallbacks (used when the LLM is unreachable or returns unparseable output)
// ---------------------------------------------------------------------------

const SENTIMENT_FALLBACK = { score: 0.5, crisis: false, dominant: 'neutral' };
const MODERATE_FALLBACK = { approved: true, flagged: false, distress: false, reason: '' };
const COMPANION_FALLBACK = {
  reply:
    "Thanks for sharing that with me — it takes something to put it into words. I'm here with you. What feels like the heaviest part of it right now?",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Calls the model in JSON mode and returns parsed JSON. Throws on any failure
// so each route can apply its own safe fallback.
async function chatJSON(system, user) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const content = completion.choices?.[0]?.message?.content ?? '';
  return JSON.parse(content);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, keyConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

// POST /api/sentiment { text } -> { score, crisis, dominant }
app.post('/api/sentiment', async (req, res, next) => {
  const text = (req.body?.text || '').toString();
  if (!text.trim()) return res.json(SENTIMENT_FALLBACK);

  try {
    const raw = await chatJSON(SENTIMENT_SYSTEM, text);
    const result = {
      score: clamp01(Number(raw.score)),
      crisis: Boolean(raw.crisis),
      dominant: normaliseDominant(raw.dominant),
    };

    // On crisis, also run moderation internally before responding (per spec).
    if (result.crisis) {
      result.moderation = await moderateText(text).catch(() => MODERATE_FALLBACK);
    }

    return res.json(result);
  } catch (err) {
    console.error('[sentiment] falling back:', err.message);
    return res.json(SENTIMENT_FALLBACK);
  }
});

// POST /api/moderate { text } -> { approved, flagged, distress, reason }
app.post('/api/moderate', async (req, res) => {
  const text = (req.body?.text || '').toString();
  if (!text.trim()) return res.json(MODERATE_FALLBACK);

  try {
    return res.json(await moderateText(text));
  } catch (err) {
    console.error('[moderate] falling back:', err.message);
    return res.json(MODERATE_FALLBACK);
  }
});

// POST /api/companion { text, history } -> { reply }
app.post('/api/companion', async (req, res) => {
  const text = (req.body?.text || '').toString();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  if (!text.trim()) return res.json(COMPANION_FALLBACK);

  try {
    const messages = [
      { role: 'system', content: COMPANION_SYSTEM },
      ...history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content) })),
      { role: 'user', content: text },
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    return res.json({ reply: reply || COMPANION_FALLBACK.reply });
  } catch (err) {
    console.error('[companion] falling back:', err.message);
    return res.json(COMPANION_FALLBACK);
  }
});

async function moderateText(text) {
  const raw = await chatJSON(MODERATE_SYSTEM, text);
  return {
    approved: raw.approved !== false,
    flagged: Boolean(raw.flagged),
    distress: Boolean(raw.distress),
    reason: typeof raw.reason === 'string' ? raw.reason : '',
  };
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function normaliseDominant(value) {
  const allowed = ['positive', 'neutral', 'negative', 'crisis'];
  return allowed.includes(value) ? value : 'neutral';
}

// Error-handling middleware — never leaks internals or the API key.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Sentinel NLP backend listening on http://localhost:${PORT} (model: ${MODEL})`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠  OPENAI_API_KEY is not set — endpoints will return safe fallbacks.');
  }
});
