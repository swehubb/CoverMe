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

export default { positiveWords, negativeWords, crisisWords };
