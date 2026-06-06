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
