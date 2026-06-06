// server.js — Cover Me / Sentinel NLP backend
// Mirrors the production shape: React -> this API -> hosted LLM (stands in for AWS Bedrock).
// The OpenAI API key lives here, server-side only, and is never sent to the frontend.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { explicitCrisisWords } from './src/data/utils/sentimentKeywords.js';

const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SENTIMENT_SYSTEM = `You are a sentiment analysis engine for a mental health journaling app used by Singapore National Servicemen. Analyse the journal entry and return ONLY valid JSON with no preamble, no markdown, no backticks.

Schema: { score: number between 0 and 1 where 0 is extremely negative and 1 is extremely positive, crisis: boolean true only if the text contains explicit self-harm or suicidal ideation, dominant: one of positive|neutral|negative|crisis }

You must correctly interpret Singlish and Singapore military slang. Use this glossary:
- sian / sian ah / super sian = drained, fed up, demotivated → negative
- jialat / jialat sia = bad situation, things are bad → negative
- tahan = barely enduring, coping under strain → negative lean
- bo chup / dun care = disengaged, checked out → negative lean
- blur / blur like sotong = confused, lost → slight negative
- siong = physically or mentally tough/gruelling → negative lean
- kena tekan = being pressured or punished → negative
- arrow = being assigned unwanted tasks → slight negative
- shiok / very shiok = feels great, satisfying → positive
- song / song ah = great, feels good → positive
- steady / steady lah = doing well, holding up → positive
- power / power leh = impressive, strong → positive
- bao toh = betrayed by someone → negative
- burn = to mess something up badly → negative
- lepak = relaxing, taking it easy → mild positive
- slack = easy time, low stress → positive lean
- chiong = going all out, high intensity → context dependent, check surrounding tone

NS-specific context:
- confinement / confined = restricted to camp, no outside contact → usually negative
- bookout / book out = leaving camp for the weekend → usually positive
- tekong = basic military training island, often stressful
- outfield = field exercises, physically demanding
- guard duty / guard = overnight duty, tiring
- status = medical excuse from activity, can be positive (rest) or negative (injury)
- admin time = free personal time → positive
- extras = punishment duties → negative

Critical rules:
- Understatement is extremely common. 'abit sian lah' means significantly drained.
- 'ok lah' or 'not bad' often masks neutral-to-negative sentiment — do not score it high positive.
- crisis must only be true for explicit self-harm or suicidal ideation. General sadness, exhaustion, or 'want to die' used hyperbolically (common in Singlish) should NOT trigger crisis unless combined with explicit intent.
- When in doubt between neutral and negative, lean negative — false negatives (missing real distress) are more harmful than false positives.`;

const MODERATE_SYSTEM = `You are a content moderation engine for a peer support platform used by Singapore National Servicemen. Analyse the text and return ONLY valid JSON with no preamble, no markdown, no backticks. Schema: { approved: boolean, flagged: boolean, distress: boolean, reason: string }. approved is false if text contains: targeted harassment, doxxing (NRIC numbers in format S/T/F/G + 7 digits + letter), explicit threats, spam. flagged is true for borderline content. distress is true if the writer appears to be in emotional distress or mentions self-harm. reason is a short human-readable explanation or empty string if approved.`;

const COMPANION_SYSTEM = `You are a compassionate AI journalling companion embedded in Cover Me, a mental wellness app for Singapore National Servicemen. Your role is to help NSmen process their thoughts and feelings through conversation.

Tone: warm, unhurried, non-judgmental. You are not a therapist. You do not diagnose. You do not give medical advice. You ask one gentle follow-up question per response to keep the conversation moving. Keep responses to 2–4 sentences maximum — NSmen are not looking for essays.

You understand NS culture:
- You know what confinement, bookout, guard duty, outfield, and tekong mean
- You understand Singlish and will not be confused by it
- You know that NSmen often understate distress — take 'abit sian lah' seriously
- You know the NS experience involves homesickness, physical strain, hierarchy stress, and identity questions

Rules:
- Never repeat the user's words back to them verbatim — it feels robotic
- Never start a response with 'I' — vary your sentence openings
- Never say 'I understand how you feel' — show it instead through your response
- If the person mentions feeling hopeless, worthless, or wanting to disappear, gently but firmly surface resources: SAF counselling at 1800-278-0022 or Samaritans of Singapore at 1-767. Do this once, then continue the conversation normally.
- If explicit self-harm or suicidal ideation appears, surface resources immediately and do not continue the conversation — end with 'Please reach out to one of these right now. You don't have to be alone with this.'
- After 8 exchanges, gently suggest the user might want to speak to a peer support leader or SAF counsellor if they want to go deeper than journalling allows.`;

const TREND_SYSTEM = `You are analysing a sentiment score trend for a Singapore NSman's journaling history. Scores range from 0 (extremely negative) to 1 (extremely positive). You will receive an array of scores in chronological order.

Return ONLY valid JSON with no preamble, no markdown, no backticks.
Schema: { narrative: string, trend: one of improving|declining|stable|volatile }

Rules for narrative:
- Maximum 25 words
- Write in second person ('You've...', 'Your entries...')
- Be specific about the pattern you see, not generic
- Do not use the word 'sentiment' or 'score' — these are invisible to the user
- Tone is warm and observational, not clinical
- If trend is improving: acknowledge the shift without being falsely cheerful
- If trend is declining: acknowledge the weight without being alarming
- If trend is stable positive: affirm without being patronising
- If trend is stable negative: name it with care
- If trend is volatile: acknowledge the up-and-down honestly

Rules for trend classification:
- improving: last 2 scores both higher than first 2 scores average
- declining: last 2 scores both lower than first 2 scores average
- volatile: difference between max and min score > 0.4
- stable: everything else`;

// ---------------------------------------------------------------------------
// Fallbacks (used when the LLM is unreachable or returns unparseable output)
// ---------------------------------------------------------------------------

const SENTIMENT_FALLBACK = { score: 0.5, crisis: false, dominant: 'neutral' };
const MODERATE_FALLBACK = { approved: true, flagged: false, distress: false, reason: '' };
const COMPANION_FALLBACK = {
  reply:
    "Thanks for sharing that with me — it takes something to put it into words. I'm here with you. What feels like the heaviest part of it right now?",
};
const TREND_FALLBACK = { narrative: 'Your recent entries show a mixed picture.', trend: 'stable' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Local crisis safety net. Only UNAMBIGUOUS self-harm phrasing hard-forces the
// crisis path (a floor for when the LLM is unreachable or under-reports). Ambiguous
// Singlish hyperbole like "want to die" is left to the model to judge in context.
function detectCrisis(text) {
  const lower = (text || '').toLowerCase();
  return explicitCrisisWords.some((phrase) => lower.includes(phrase));
}

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

  // Keyword safety net is computed independently of the LLM and OR'd in below.
  const keywordCrisis = detectCrisis(text);

  try {
    const raw = await chatJSON(SENTIMENT_SYSTEM, text);
    const crisis = Boolean(raw.crisis) || keywordCrisis;
    const result = {
      score: crisis ? Math.min(clamp01(Number(raw.score)), 0.1) : clamp01(Number(raw.score)),
      crisis,
      dominant: crisis ? 'crisis' : normaliseDominant(raw.dominant),
    };

    // On crisis, also run moderation internally before responding (per spec).
    if (result.crisis) {
      result.moderation = await moderateText(text).catch(() => MODERATE_FALLBACK);
    }

    return res.json(result);
  } catch (err) {
    console.error('[sentiment] falling back:', err.message);
    // Even on total LLM failure, the keyword net still flags explicit self-harm.
    return res.json(
      keywordCrisis ? { score: 0.05, crisis: true, dominant: 'crisis' } : SENTIMENT_FALLBACK,
    );
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

// POST /api/companion { message, history } -> { reply }
// Multi-turn: history is the full prior conversation; the new user message is
// appended before sending the whole thread to the model.
app.post('/api/companion', async (req, res) => {
  const message = (req.body?.message ?? req.body?.text ?? '').toString();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  if (!message.trim()) return res.json(COMPANION_FALLBACK);

  try {
    const messages = [
      { role: 'system', content: COMPANION_SYSTEM },
      ...history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m) => ({ role: m.role, content: String(m.content) })),
      { role: 'user', content: message.trim() },
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

// POST /api/trend-narrative { scores: number[] } -> { narrative, trend }
// scores are chronological, most recent last (3–7 used). trend is classified
// deterministically server-side so the UI colour always matches the rules.
app.post('/api/trend-narrative', async (req, res) => {
  const scores = Array.isArray(req.body?.scores)
    ? req.body.scores.map(Number).filter(Number.isFinite)
    : [];
  if (scores.length < 3) return res.json(TREND_FALLBACK);

  const trimmed = scores.slice(-7);
  const trend = classifyTrend(trimmed);

  try {
    const raw = await chatJSON(TREND_SYSTEM, JSON.stringify(trimmed));
    const narrative =
      typeof raw.narrative === 'string' && raw.narrative.trim()
        ? raw.narrative.trim()
        : TREND_FALLBACK.narrative;
    return res.json({ narrative, trend });
  } catch (err) {
    console.error('[trend-narrative] falling back:', err.message);
    return res.json({ narrative: TREND_FALLBACK.narrative, trend });
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

// Deterministic trend classification (matches the rules in TREND_SYSTEM).
function classifyTrend(scores) {
  const firstAvg = (scores[0] + scores[1]) / 2;
  const lastTwo = scores.slice(-2);
  const spread = Math.max(...scores) - Math.min(...scores);

  if (lastTwo.every((s) => s > firstAvg)) return 'improving';
  if (lastTwo.every((s) => s < firstAvg)) return 'declining';
  if (spread > 0.4) return 'volatile';
  return 'stable';
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
