// server.js — Cover Me / Sentinel NLP backend
// Mirrors the production shape: React -> this API -> hosted LLM (stands in for AWS Bedrock).
// The OpenAI API key lives here, server-side only, and is never sent to the frontend.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { explicitCrisisWords } from './src/data/utils/sentimentKeywords.js';

const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';

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

const MODERATE_SYSTEM = `You are a content moderation engine for a peer support platform used by Singapore National Servicemen. Analyse the text and return ONLY valid JSON with no preamble, no markdown, no backticks. Schema: { approved: boolean, flagged: boolean, distress: boolean, reason: string }. approved is false if text contains ANY of: profanity or vulgar language, insults or personal attacks, mockery or ridicule of others, hostile or aggressive language, content with clear ill intent toward any person or group, targeted harassment, doxxing (NRIC numbers in format S/T/F/G + 7 digits + letter), explicit threats, spam, or any content that would make the platform feel unsafe or unwelcoming. This is a peer support space — apply a high standard. flagged is true for borderline content that is rude or dismissive without being explicitly harmful. distress is true if the writer appears to be in emotional distress or mentions self-harm. reason is a warm, gentle message (2–3 sentences) addressed directly to the writer. Acknowledge that NS is tough and emotions can run high, but redirect them to rephrase in a way that is kind and supportive. Do not just label the problem — guide them toward a better version. Example style: "It sounds like things are weighing on you, and that is completely valid. This wall is a space for lifting each other up though, so try rephrasing without the harsh language — your experience is worth sharing in a way others can receive." Return empty string if approved.`;

const BUDDY_TAP_SYSTEM = `You are a welfare concern validator for Buddy Tap, a feature in Cover Me that lets Singapore NSmen flag a genuine welfare concern about a platoon mate to a support officer.

Approve the note if it comes from a place of genuine care — this includes simple expressions of worry ("I'm worried about him", "he doesn't seem okay", "something feels off"), vague but sincere concern, observations about behaviour or mood, or any note where the writer is clearly looking out for their buddy. You do not need specific details. Genuine care, even if brief or hard to articulate, is enough.

Reject the note ONLY if it is clearly not a welfare concern: a personal grievance or dislike ("I don't like him", "he is so annoying", "he smells"), mockery or ridicule of the buddy, gossip with no welfare intent, or notes containing profanity, hostility, or insults directed at the buddy. When in doubt, approve — it is better to surface a concern that turns out to be minor than to block someone who is genuinely worried.

Return ONLY valid JSON: { approved: boolean, flagged: boolean, distress: boolean, reason: string }. reason is a warm, 2-3 sentence message addressed to the writer. If rejected because the note is not a genuine welfare concern, gently explain what Buddy Tap is for. If rejected due to tone or language, acknowledge that NS can be frustrating but redirect them to focus on genuine care. Return empty string if approved.`;

const COMPANION_SYSTEM = `You are a compassionate AI wellness companion embedded in Cover Me, a mental health app for Singapore National Servicemen. Your role is to help NSmen process their thoughts and feelings, provide evidence-informed emotional support, and connect them to appropriate resources when needed.

ROLE BOUNDARIES
You are not a therapist, doctor, or medical professional. You do not diagnose, prescribe, or treat. You are a knowledgeable, warm companion — someone who helps the user feel heard while gently guiding them toward healthy coping.

TONE
Warm, grounded, and unhurried. Non-judgmental. Genuinely present. Ask one thoughtful follow-up question per response. Keep responses to 3–5 sentences — NSmen value directness.

NS CULTURAL COMPETENCE
- You understand: confinement, bookout, guard duty, outfield, tekong, SAF rank structure, vocations, BMT, OCS/SCS, PES status, IPPT
- You speak Singlish fluently and will never misread it as more positive than it is
- NSmen commonly understate distress — take "abit sian lah", "just tired", "nvm it's fine" seriously; probe gently
- Common NS stressors: homesickness, sleep deprivation, physical strain, rigid hierarchy, identity disruption, social isolation, strained family relationships, uncertainty about the future. Hold space for all of it

EVIDENCE-INFORMED SUPPORT
When it fits naturally, gently introduce:
- Box breathing (inhale 4, hold 4, exhale 4, hold 4) for acute anxiety or anger before it spills over
- 5-4-3-2-1 grounding (5 things you see, 4 hear, 3 can touch, 2 smell, 1 taste) for overwhelm or dissociation
- Behavioural activation — one small achievable action when the user feels stuck or low
- Cognitive defusion — gently questioning unhelpful automatic thoughts ("is that thought definitely true, or is it the exhaustion talking?") without dismissing the underlying feeling
- The evidence-backed reminder that thoughts are not facts, and that intense emotions, while real, are temporary
Never lecture or dump a list of techniques. Introduce them only when they fit organically.

WHAT YOU MUST NEVER DO — THIS IS NON-NEGOTIABLE
- Never validate, encourage, or reinforce thoughts of self-harm, suicide, or harming others. These thoughts cause real suffering; your job is to help the user move toward safety, not to explore or affirm them
- Never engage with the specifics of a self-harm or suicide plan. Do not ask for details, do not discuss methods, timing, or means under any circumstances — doing so causes harm
- Never suggest, imply, or allow the impression that self-harm is an understandable coping mechanism or a valid option
- Never romanticise pain or frame suffering as meaningful in a way that could make self-harm feel appealing
- Never leave a person in active crisis without directing them immediately to emergency resources
- Never repeat the user's words back verbatim — it feels robotic
- Never start a response with 'I'
- Never say "I understand how you feel" — demonstrate it through your response instead

DISTRESS ESCALATION PROTOCOL

Mild hopelessness or worthlessness (e.g. "I feel useless", "nobody cares", "what's the point"):
→ Validate the emotion warmly without reinforcing the belief as fact. Surface resources once, gently: "If this feeling keeps weighing on you, the SAF Counselling Centre is there for exactly this — 1800-278-0022 (Mon–Fri). You don't have to carry it alone." Then continue the conversation with care.

Active suicidal ideation, explicit self-harm intent, or statements like "I want to end it", "I want to hurt myself":
→ Stop the conversation. Do not engage with the content of the self-harm thought. Respond only with genuine warmth and immediate resources:
"What you're feeling sounds overwhelming, and reaching out — even here — took courage. Please contact one of these right now:
SAF Care Hotline (24/7): 1800-278-0033
Samaritans of Singapore (24/7): 1-767
Institute of Mental Health: 6389-2222
If you are in immediate danger, call 995 or go to the nearest A&E.
You don't have to face this alone."
Do not continue the conversation after this response.

After 8 substantive exchanges on emotional topics:
→ Gently suggest that a peer support leader or SAF counsellor can offer what a chatbot cannot: "At some point, talking to a real person — a PSL in your unit or a SAF counsellor — can go much deeper than I can. That's not a sign of weakness; it's the smartest move. Is that something you'd be open to?"`;


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

// POST /api/moderate { text, context? } -> { approved, flagged, distress, reason }
// context: 'buddy' uses the stricter Buddy Tap welfare-concern prompt; default uses the wall prompt.
app.post('/api/moderate', async (req, res) => {
  const text = (req.body?.text || '').toString();
  const context = req.body?.context || 'wall';
  if (!text.trim()) return res.json(MODERATE_FALLBACK);

  const system = context === 'buddy' ? BUDDY_TAP_SYSTEM : MODERATE_SYSTEM;
  try {
    return res.json(await moderateText(text, system));
  } catch (err) {
    console.error('[moderate] falling back:', err.message);
    return res.json(MODERATE_FALLBACK);
  }
});

// POST /api/weekend-plan { pesStatus, vocation, ipptGoal, currentScore, currentAward, attempts }
// -> { summary, days: [{ id, label, duration, workout }] }
const WEEKEND_PLAN_SYSTEM = `You are a physical training advisor for Singapore National Servicemen. Generate a personalised 2-day weekend IPPT training plan.

Return ONLY valid JSON with no preamble, no markdown, no backticks.
Schema: { "summary": string, "days": [{ "id": string, "label": string, "duration": string, "workout": string }] }

Rules:
- days must have exactly 2 entries: first has id "sat" and label "Saturday", second has id "sun" and label "Sunday"
- summary: 1-2 sentences explaining the weekend focus given current standing
- duration: e.g. "50 min"
- workout: specific, practical instructions (2-4 sentences). Name actual exercises, sets, reps. Reference the vocation where appropriate.
- Tailor intensity to the PES status, vocation physical demands, IPPT goal, and gap between current score and goal
- Do not prescribe high-impact running for PES C or E
- Keep language direct and practical, not motivational-poster style`;

app.post('/api/weekend-plan', async (req, res) => {
  const { pesStatus, vocation, ipptGoal, currentScore, currentAward, attempts } = req.body || {};
  const recentAttempts = Array.isArray(attempts) ? attempts.slice(-3) : [];
  const attemptsText = recentAttempts.length
    ? recentAttempts.map((a) => `Score: ${a.score}, Push-ups: ${a.pushups}, Sit-ups: ${a.situps}, Run: ${a.runTime}`).join('; ')
    : 'No attempts logged yet';

  const prompt = `PES Status: ${pesStatus || 'A'}\nVocation: ${vocation || 'General'}\nIPPT Goal: ${ipptGoal || 'Pass'}\nCurrent Score: ${currentScore ?? 'No attempts yet'}\nCurrent Award: ${currentAward || 'None'}\nRecent Attempts: ${attemptsText}\n\nGenerate the 2-day weekend training plan.`;

  try {
    const raw = await chatJSON(WEEKEND_PLAN_SYSTEM, prompt);
    if (!raw?.days?.length) throw new Error('Invalid shape');
    return res.json(raw);
  } catch (err) {
    console.error('[weekend-plan] falling back:', err.message);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// POST /api/recommend-workout { pes, recentLogs } -> week plan | { useDefault: true }
// recentLogs: up to the last 5 COMPLETED workout sessions. Empty => default template
// (no LLM call). The model applies progressive overload within the allowed library.
const RECOMMEND_WORKOUT_SYSTEM = `You are a progressive overload fitness coach for Singapore National Servicemen preparing for IPPT. You will receive a user's PES status and their last few workout logs. Generate a 7-day workout plan with progressive overload adjustments based on their recent performance.

STRICT RULES:
- You may ONLY suggest exercises from these exact lists:
  Push-up variants: Normal pushups, Diamond pushups, Wide-arm pushups, Negative pushups, Knees on ground pushups
  Sit-up variants: Situps, Leg raises, Bicycle crunches, Flutter kicks, Russian twists
  Run variants: Interval run, Tempo run, Aerobic run
- Progressive overload logic: if the user completed all target sets and reps for an exercise in their last session, increase reps by 2 or sets by 1. If they did not complete all sets, keep the same target. If they missed the exercise entirely, keep or reduce slightly.
- For runs: if they completed the run, increase duration by 5 min or increase interval count by 1.
- Never prescribe exercises beyond the user's PES capability — PES C and below: no running variants except Aerobic run, no Diamond or Wide-arm pushups.
- Sunday is always rest.
- Return ONLY valid JSON, no preamble, no markdown, no backticks.

JSON schema:
{
  "useDefault": false,
  "days": {
    "Monday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Tuesday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Wednesday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Thursday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Friday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Saturday": { "focus": "string", "exercises": [ { "name": "string", "targetSets": 0, "targetReps": 0 } ] },
    "Sunday": { "focus": "Rest", "exercises": [] }
  }
}`;

const RECOMMEND_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

app.post('/api/recommend-workout', async (req, res) => {
  const pes = (req.body?.pes || 'B1').toString();
  const recentLogs = Array.isArray(req.body?.recentLogs) ? req.body.recentLogs : [];

  // No history → caller uses the local PES default template; no LLM call needed.
  if (recentLogs.length === 0) return res.json({ useDefault: true });

  const logsText = recentLogs
    .slice(-5)
    .map((log) => {
      const date = (log?.date || '').toString().slice(0, 10);
      const exercises = Array.isArray(log?.exercises)
        ? log.exercises
            .map((ex) => {
              const sets = Array.isArray(ex?.sets) ? ex.sets : [];
              const detail = sets.map((s) => `${s?.reps ?? '-'}r${s?.weight != null ? `@${s.weight}kg` : ''}`).join(', ');
              return `${ex?.name || 'Unknown'}: ${sets.length} sets [${detail}]`;
            })
            .join('; ')
        : 'no exercises';
      return `${log?.day || '?'} (${date}): ${exercises}`;
    })
    .join('\n');

  const prompt = `PES Status: ${pes}\nLast ${Math.min(recentLogs.length, 5)} completed sessions:\n${logsText}\n\nGenerate the progressive-overload 7-day plan.`;

  try {
    const raw = await chatJSON(RECOMMEND_WORKOUT_SYSTEM, prompt);
    if (!raw?.days || RECOMMEND_DAYS.some((day) => !raw.days[day])) throw new Error('Invalid shape');
    return res.json({ useDefault: false, days: raw.days });
  } catch (err) {
    console.error('[recommend-workout] falling back:', err.message);
    return res.json({ useDefault: true });
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

async function moderateText(text, system = MODERATE_SYSTEM) {
  const raw = await chatJSON(system, text);
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

// ---------------------------------------------------------------------------
// NS Chatbot — RAG over curated official SAF / NS documentation
// ---------------------------------------------------------------------------

const NS_KNOWLEDGE_BASE = `
## BMT (Basic Military Training)
Source: ns.sg, mindef.gov.sg
- BMT lasts approximately 9–10 weeks and is the foundational training phase for all NSFs.
- Army BMT is conducted at BMTC, Pulau Tekong. Navy and Air Force BMT occurs at their respective training establishments.
- Training covers: weapon handling, field craft, first aid, physical training, SAF core values, and basic military protocols.
- The first 1–2 weeks are a confinement period; recruits remain in camp and may not book out.
- After confinement, recruits typically book out Friday evening and book in Sunday evening.
- BMT concludes with a graduation parade.

## PES (Physical Employment Status)
Source: ns.sg, CMPB
- PES is assigned after the pre-enlistment medical examination at CMPB (Central Manpower Base).
- PES A: Combat fit, eligible for all combat vocations (infantry, commandos, guards, armour, artillery).
- PES B1: Combat fit with minor conditions; eligible for most combat roles.
- PES B2: Fit with physical limitations; eligible for selected combat-support roles.
- PES C: Non-combat fit; assigned to non-combat vocations (admin, logistics, signals).
- PES E: Temporary medical status, pending re-evaluation at CMPB.
- PES F: Permanently medically unfit — very rare; results in NS exemption.
- PES can be reviewed if a medical condition changes; request a review through CMPB at ns.sg.

## IPPT (Individual Physical Proficiency Test)
Source: ns.sg
- IPPT has three stations: push-ups (1 minute, max 25 points), sit-ups (1 minute, max 25 points), 2.4km run (max 50 points). Total: 100 points.
- Award bands: Fail (<51 points), Pass (51–60), Pass with Incentive (61–74), Silver (75–84), Gold (85+).
- Monetary incentives: Pass with Incentive — $200; Silver — $500; Gold — $500 (additional bonuses may apply for NSmen).
- Recruits scoring below 51 must complete NS Fit remediation sessions.
- IPPT is administered multiple times per year; booking is through the IPPT booking system on ns.sg.
- Scoring tables are age-adjusted for operationally ready NSmen (ICT personnel), not for full-time NSFs.

## NS Allowance
Source: ns.sg, CPF Board (cpf.gov.sg)
- Monthly allowances (effective 2024–2025, subject to periodic review — verify at ns.sg):
  Recruit: $630 | Private: $680 | Lance Corporal: $780 | Corporal: $880 | Corporal First Class: $930
  3rd Sergeant: $1,120 | 2nd Sergeant: $1,150 | 1st Sergeant: $1,190
  2nd Lieutenant: $1,460 | Lieutenant: $1,570
- Allowances are paid monthly by MINDEF directly.
- A portion is saved in the Operationally Ready NSman Savings Fund (ORSF), paid out upon ORD.
- Always verify current rates at ns.sg as rates are subject to government review.

## Book In / Book Out
Source: ns.sg
- After the confinement period, NSFs typically book out Friday evening and book in Sunday evening.
- Exact timings are set by the unit and may change for field exercises, live-firing, or other training requirements.
- Public holidays generally result in additional book-out days per the SAF public holiday calendar.
- Late book-in is a military offence — always confirm timings with your section commander.

## OOC (Out of Course)
Source: ns.sg
- OOC occurs when a recruit cannot continue with their current BMT batch.
- Reasons include: injury, significant medical condition, or administrative issues.
- Recruits who OOC due to injury go to a holding company to recover, then are re-coursed into a later batch.
- OOC due to an underlying medical condition may trigger a PES review at CMPB.
- OOC is a training management process and not a disciplinary record.

## Medical and Sick Reporting
Source: ns.sg, SAF Medical Corps
- Report any injury or illness to your section commander immediately — do not try to cope without reporting.
- You will be sent to the camp Medical Officer (MO) at the camp medical centre.
- The MO can issue a medical certificate (MC), light duty (LD) chit, or excuse certain activities.
- Serious injuries requiring hospital treatment are handled by SAF evacuation procedures.
- After-hours medical emergencies: inform the duty officer or duty medic immediately.
- Do not self-medicate with unprescribed medication; this may affect your medical record.

## Phone and Personal Devices
Source: ns.sg
- Personal phones are permitted in camp but usage is restricted to admin time and off-training hours.
- Phones must be surrendered during security-sensitive activities including field exercises and live-firing.
- Photography is restricted in most areas of camp — follow your unit's posted regulations.
- Your section commander will brief you on the specific phone policy on Day 1 of enlistment.

## Food and Cookhouse
Source: ns.sg
- All meals are provided at the camp cookhouse during training hours (breakfast, lunch, dinner).
- Menus rotate and include rice, noodles, vegetables, protein, and soup options.
- Halal-certified and vegetarian options are available; inform your section commander of dietary needs on Day 1.
- NSFs with documented severe food allergies should inform both their section commander and the MO.

## Family Visits and Contact
Source: ns.sg
- Family visits are permitted during designated visiting hours after the confinement period, typically on weekends.
- During confinement (first 1–2 weeks), visits may not be permitted.
- Recruits may call family using personal phones during admin time.
- Mail can be sent to and from camp; your unit will provide a mailing address.

## Religious Accommodation
Source: ns.sg
- SAF accommodates all religious practices within the bounds of operational requirements.
- Muslim NSFs receive halal meals and are given time for obligatory prayers where operationally feasible.
- Weekend worship services (Christian, Catholic, Buddhist, Hindu) are facilitated through the unit chaplain.
- Religious items (prayer beads, religious texts) may be kept in personal storage.
- Inform your section commander of specific requirements during the Day 1 admin brief.

## Haircut and Grooming
Source: ns.sg
- All male NSFs receive a standard military haircut upon enlistment; hair must be kept short throughout BMT.
- Hair must not touch the ears or collar when standing at attention.
- Female NSFs with long hair must tie it up neatly in a bun.
- Facial hair is generally not permitted during BMT; policies vary post-BMT by unit.
- Haircuts are provided within camp at regular intervals.

## Ranks and Promotions
Source: ns.sg, mindef.gov.sg
- Enlistment rank: Recruit (REC). After BMT completion: Private (PTE).
- Promotion from PTE to Lance Corporal (LCP) and Corporal (CPL) depends on vocation course results and unit assessment.
- Selection for Specialist Cadet School (SCS) leads to NCO ranks (3rd Sergeant and above).
- Selection for Officer Cadet School (OCS) leads to officer ranks (2nd Lieutenant and above).
- Not all NSFs are selected for SCS or OCS; the majority serve as specialists (CPL/3SG level) or privates.
- OCS and SCS selections are based on BMT performance, educational qualifications, and leadership potential.

## Vocation and Posting
Source: ns.sg
- Vocation is assigned after BMT based on: PES status, IPPT performance, educational qualifications, stated preferences, and MINDEF manpower needs.
- A vocation preference form may be submitted — placement is not guaranteed.
- Posting results are typically announced towards the end of BMT.
- Common vocations: infantry, armour, artillery, combat engineers, signals, logistics, transport, medic, military police, admin support.
- PES A/B1 recruits are eligible for combat vocations; PES B2/C recruits are placed in non-combat or support roles.

## Mental Health and Welfare
Source: ns.sg, SAF Counselling Centre
- SAF provides multiple confidential support channels:
  - Unit Peer Support Leader (PSL): a trained peer within your unit, conversations are confidential
  - SAF Counselling Centre: 1800-278-0022 (Mon–Fri, 8:30am–5:30pm)
  - SAF Care Line: 1800-278-0033 (available 24 hours)
  - IMH Mental Health Helpline: 6389 2222
  - Samaritans of Singapore (SOS): 1767 (24 hours)
- Seeking support is not a sign of weakness and is encouraged. Help-seeking is protected under SAF welfare policies.
- All counselling is confidential unless there is an imminent risk to life.

## NS Portal and Administrative Services
Source: ns.sg
- ns.sg is the official one-stop portal for all NS administrative matters.
- Services available: enlistment details, IPPT booking, NS allowance statements, ICT call-up notices, welfare resources.
- Access requires SingPass (two-factor authentication).
- For discrepancies in personal data or enlistment information, contact CMPB directly via ns.sg.

## SAFRA Membership
Source: safra.sg
- All full-time NSFs and operationally ready NSmen are eligible for SAFRA membership.
- SAFRA provides recreation facilities, F&B discounts, fitness centres, and social events.
- Membership is complimentary for full-time NSFs; a nominal fee applies after ORD.
- SAFRA clubs are located islandwide.

## SAF Group Insurance
Source: mindef.gov.sg
- All NSFs are covered by SAF Group Insurance from day one of enlistment at no cost to the NSF.
- Coverage includes death, total permanent disability, and hospitalisation benefits.
- Beneficiary details should be updated through the SAF Group Insurance administrator; forms are provided during the enlistment admin brief.

## Operationally Ready NSman Savings Fund (ORSF)
Source: cpf.gov.sg, ns.sg
- A portion of NS allowance is automatically set aside into an ORSF account managed by CPF Board.
- The full accumulated ORSF amount is paid out in a lump sum upon ORD (Operationally Ready Date).
- ORSF contributions are scaled by rank and duration of full-time service.
- NSmen can track ORSF contributions through CPF online services with SingPass.

## What to Pack for Enlistment
Source: ns.sg
- Essential documents: enlistment letter, NRIC, educational certificates (O/A-Level, ITE, Poly, Degree), medical records if relevant.
- Toiletries: toothbrush, toothpaste, shampoo (travel size), soap, shaver, nail clipper, plain padlock.
- Clothing: plain white T-shirts, dark shorts, white socks, plain slippers for admin time; civilian clothes for book-out.
- Do not bring valuables, jewellery, or items not listed in your enlistment letter.
- Label all personal items with your full name.
- Ziplock bags are highly recommended for document and kit organisation.
- Issued items (uniforms, boots, field pack) are provided by SAF — do not purchase military gear beforehand.
`;

const CHAT_SYSTEM = `You are the Cover Me NS Assistant — a trusted information tool for Singapore National Servicemen and pre-enlistees.

Your ONLY job is to answer NS-related questions using the official SAF documentation provided in the KNOWLEDGE BASE below.

STRICT RULES — follow these exactly:
1. Answer ONLY using facts explicitly stated in the KNOWLEDGE BASE. Do not draw on any external knowledge, training data, or assumptions.
2. If the question cannot be fully answered from the KNOWLEDGE BASE, respond with this exact message:
   "I can only answer from verified official SAF documentation. This question falls outside my current knowledge base. For authoritative information, please visit ns.sg or contact CMPB directly."
3. Always end your answer with the source line from the knowledge base (e.g. "Source: ns.sg").
4. Never speculate, estimate, or say "I think" or "probably". Only state what is explicitly documented.
5. Keep answers concise — 3 to 6 sentences unless the topic genuinely requires more detail.
6. If asked something personal (e.g. "what is my PES?"), explain that you cannot access personal records and direct the user to ns.sg or CMPB.
7. FORMATTING: Write in plain prose. Do NOT use markdown asterisks (**) or any other markdown syntax. If you need to list multiple items, put each item on its own line starting with a number and a full stop (e.g. "1. Item here").

KNOWLEDGE BASE:
${NS_KNOWLEDGE_BASE}`;

// POST /api/chat { text } -> { answer, source, matched }
app.post('/api/chat', async (req, res) => {
  const text = (req.body?.text || '').toString().trim();
  if (!text) {
    return res.json({ answer: 'Please ask a question.', source: null, matched: true });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      messages: [
        { role: 'system', content: CHAT_SYSTEM },
        { role: 'user', content: text },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || '';
    const outOfScope = answer.includes('outside my current knowledge base');

    return res.json({
      answer,
      source: outOfScope ? null : 'Verified SAF documentation (ns.sg / mindef.gov.sg)',
      matched: !outOfScope,
    });
  } catch (err) {
    console.error('[chat] error:', err.message);
    return res.json({
      answer:
        'I am temporarily unavailable. For official NS information, please visit ns.sg or contact CMPB directly.',
      source: null,
      matched: false,
    });
  }
});

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
