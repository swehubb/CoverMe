// src/services/mockNotification.js
// Handles in-app notifications — not push notifications (demo only)
// Used by: UserEscalation (Screen 16), BuddyTap (Screen 14)

// Escalation resources — surfaced when sentiment declines or crisis detected
export const escalationOptions = [
  {
    id: "ai-companion",
    label: "Chat with AI companion",
    description: "Talk through what you're feeling with a structured, non-judgmental AI journaling companion.",
    icon: "chat",
    action: "openAICompanion",
  },
  {
    id: "peer-support",
    label: "Connect with peer support leader",
    description: "Connect anonymously with a trained peer support leader in your unit. No names shared.",
    icon: "people",
    action: "connectPeerSupport",
  },
  {
    id: "saf-counselling",
    label: "Access SAF counselling",
    description: "Speak directly with a SAF counsellor. Confidential and free.",
    icon: "phone",
    action: "openSAFCounselling",
  },
  {
    id: "dismiss",
    label: "I'm okay, thanks",
    description: "Dismiss this nudge. Your journal entry is still saved privately.",
    icon: "check",
    action: "dismiss",
  },
];

// Crisis resources — surfaced immediately when crisis language detected
export const crisisResources = {
  title: "Immediate support resources",
  message: "It sounds like you might be going through something really difficult. You don't have to face this alone.",
  resources: [
    { name: "SAF Counselling Hotline", number: "1800-278-0022", hours: "Mon-Fri, 8:30am-5:30pm" },
    { name: "SAF Care Line (24 hours)", number: "1800-278-0033", hours: "24/7" },
    { name: "National Care Hotline", number: "1800-202-6868", hours: "8am-12am daily" },
    { name: "Institute of Mental Health", number: "6389-2222", hours: "24/7" },
    { name: "Samaritans of Singapore", number: "1-767", hours: "24/7" },
  ],
  disclaimer: "No commander, peer support leader, or any third party has been notified. These resources are for you only.",
};

// Buddy tap notification — sent to recipient when 3 taps reached
export const buddyTapNotification = {
  title: "Someone cares about you",
  message: "Some people in your unit are thinking about you and care about how you're doing. You're not alone.",
  resources: [
    "Talk to someone you trust in your section",
    "Reach out to your unit's Peer Support Leader",
    "SAF Counselling Hotline: 1800-278-0022",
    "Cover Me AI Companion (available in-app)",
  ],
  footer: "No one has been identified. No superior has been notified. This message was triggered by people who care.",
};

// notify(type, payload) -> ready-to-render modal content.
// Reuses the constants above so copy stays consistent across screens.
export function notify(type, payload = {}) {
  switch (type) {
    case "buddy_threshold": {
      const name = payload.recipientName ? `${payload.recipientName} ` : "";
      return {
        title: buddyTapNotification.title,
        message: `${name}has been tapped by three people who care. An anonymous message of support has been sent directly to them.`,
        body: buddyTapNotification.message,
        resources: buddyTapNotification.resources,
        footer: buddyTapNotification.footer,
      };
    }
    case "escalation_nudge": {
      const days = payload.trendDays || 5;
      return {
        title: "A gentle check-in",
        message: `Your private trend has been lower for ${days} day${days === 1 ? "" : "s"}. Nothing has been shared with anyone — you decide what happens next.`,
        cta: "See your options",
      };
    }
    case "crisis_resources":
    default:
      return {
        title: crisisResources.title,
        message: crisisResources.message,
        resources: crisisResources.resources.map((r) => ({ name: r.name, contact: r.number })),
        disclaimer: crisisResources.disclaimer,
      };
  }
}

export default { escalationOptions, crisisResources, buddyTapNotification, notify };
