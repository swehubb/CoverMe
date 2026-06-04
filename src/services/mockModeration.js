// src/services/mockModeration.js
// Content moderation — shared by PeerIntelFeed (Screen 9), PeerSupportWall (Screen 15), BuddyTap (Screen 14)
// Interface: check(text) => { approved, flagged, distress, reason }

const profanity = ["fuck", "shit", "damn", "bastard", "idiot", "stupid", "dumb", "loser", "retard"];
const insults = ["useless", "worthless", "pathetic", "disgusting", "trash", "garbage"];
const distressSignals = [
  "want to die", "kill myself", "end it", "suicide", "self-harm",
  "can't take it anymore", "no point living", "no one cares",
  "i need help", "please help", "i'm scared", "i don't know what to do",
  "breaking down", "can't stop crying", "hurting so much",
];

// Patterns suggesting bad-faith buddy taps
const mockingPatterns = ["lol", "haha", "lmao", "so slow", "so weak", "cannot make it", "waste time", "for fun"];

export function check(text, context = "general") {
  const lower = text.toLowerCase().trim();

  // Empty or too short
  if (lower.length < 5) {
    return { approved: false, flagged: true, distress: false, reason: "Message too short to be meaningful." };
  }

  // Distress detection — flag but still allow (with resources)
  for (const signal of distressSignals) {
    if (lower.includes(signal)) {
      return {
        approved: true,
        flagged: false,
        distress: true,
        reason: "Genuine distress detected. Resources will be surfaced to the poster.",
      };
    }
  }

  // Profanity check
  for (const word of profanity) {
    if (lower.includes(word)) {
      return {
        approved: false,
        flagged: true,
        distress: false,
        reason: "This post was flagged by our moderation system. Please rephrase to keep this a supportive space.",
      };
    }
  }

  // Targeted insults
  for (const word of insults) {
    // Only flag if directed at someone (contains "you" or a name-like pattern)
    if (lower.includes(word) && (lower.includes("you") || lower.includes("he ") || lower.includes("she "))) {
      return {
        approved: false,
        flagged: true,
        distress: false,
        reason: "This post appears to contain targeted negative language. Please rephrase to keep this a supportive space.",
      };
    }
  }

  // Buddy tap specific: detect mocking/bad-faith entries
  if (context === "buddyTap") {
    for (const pattern of mockingPatterns) {
      if (lower.includes(pattern)) {
        return {
          approved: false,
          flagged: true,
          distress: false,
          reason: "Flagged as non-genuine concern (mocking tone detected). Buddy taps are for sincere welfare concerns only.",
        };
      }
    }
  }

  // Passed all checks
  return { approved: true, flagged: false, distress: false, reason: null };
}

export default { check };
