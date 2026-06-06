// src/utils/sentimentKeywords.js
// Keyword lists for demo sentiment analysis
// Production would use a fine-tuned NLP model on Singlish corpora

export const positiveWords = [
  "happy", "grateful", "motivated", "proud", "better", "good", "great",
  "excited", "confident", "accomplished", "relief", "relieved", "glad",
  "fun", "enjoyed", "progress", "improved", "achieved", "comfortable",
  "rested", "energised", "peaceful", "calm", "hopeful", "looking forward",
  "personal best", "pb", "passed", "gold", "silver", "support",
  "friends", "family", "helped", "thanked", "laughed", "bonded",
];

export const negativeWords = [
  "stressed", "tired", "scared", "alone", "frustrated", "worried",
  "anxious", "sad", "angry", "exhausted", "overwhelmed", "homesick",
  "miss home", "struggling", "can't sleep", "embarrassed", "ashamed",
  "failure", "failed", "useless", "hopeless", "pointless", "hate",
  "terrible", "miserable", "scolded", "punished", "pain", "hurt",
  "unfair", "lonely", "isolated", "depressed", "heavy", "dread",
  "cannot cope", "giving up", "no point", "waste of time",
];

export const crisisWords = [
  "kill myself", "end it all", "suicide", "self-harm", "self harm",
  "don't want to live", "want to die", "no reason to live",
  "better off dead", "hurt myself", "cutting myself",
  "jump off", "end my life", "can't go on",
];

// Unambiguous self-harm / suicidal phrasing that is never hyperbolic. These hard-
// force the crisis path as a safety floor even when the model is unavailable.
// Ambiguous phrases ("want to die", "can't go on", "hurt myself" — often hyperbolic
// in Singlish) are deliberately left OUT, so the model can judge them in context.
export const explicitCrisisWords = [
  "kill myself", "suicide", "end my life", "cutting myself",
  "better off dead", "self-harm", "self harm", "no reason to live",
];

export default { positiveWords, negativeWords, crisisWords, explicitCrisisWords };
