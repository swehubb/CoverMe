// src/services/mockSentiment.js
// Keyword-based sentiment analysis for demo
// Production: fine-tuned NLP model on Singlish corpora via AWS Bedrock
// Used by: DailyJournal (Screen 13), UserEscalation (Screen 16)

import { positiveWords, negativeWords, crisisWords } from "../utils/sentimentKeywords";

export function analyzeSentiment(text) {
  const lower = text.toLowerCase();

  // Crisis detection — highest priority
  for (const phrase of crisisWords) {
    if (lower.includes(phrase)) {
      return {
        score: 0.05,
        crisis: true,
        label: "Crisis detected",
        detail: "Crisis-level language detected. Surfacing resources immediately.",
      };
    }
  }

  // Count positive and negative word matches
  let posCount = 0;
  let negCount = 0;

  for (const word of positiveWords) {
    if (lower.includes(word)) posCount++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negCount++;
  }

  const total = posCount + negCount;

  // If no keywords matched, return neutral
  if (total === 0) {
    return { score: 0.5, crisis: false, label: "Neutral", detail: "No strong sentiment signals detected." };
  }

  // Score: 0 = fully negative, 1 = fully positive
  const score = Math.min(1, Math.max(0, posCount / total));

  let label;
  if (score >= 0.7) label = "Positive";
  else if (score >= 0.4) label = "Mixed";
  else label = "Low";

  return { score: Math.round(score * 100) / 100, crisis: false, label, detail: null };
}

// Check if the last N entries show a declining trend (for escalation trigger)
export function checkDeclineStreak(entries, minDays = 5) {
  if (entries.length < minDays) return { declining: false, streak: 0 };

  const recent = entries.slice(-minDays);
  let declining = true;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i].sentimentScore >= recent[i - 1].sentimentScore) {
      declining = false;
      break;
    }
  }

  return { declining, streak: declining ? minDays : 0 };
}

export default { analyzeSentiment, checkDeclineStreak };
