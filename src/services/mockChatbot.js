// src/services/mockChatbot.js
// VPC-bounded chatbot — retrieval-only from verified SAF documentation
// Used by: VPCChatbot (Screen 8)
// NOT open-ended generation. If query doesn't match, show fallback.

const FALLBACK_MESSAGE = "I can only answer from verified SAF documentation. This question falls outside my current knowledge base. Please check ns.sg for official information, or ask your enlistment officer directly.";

const qaDatabase = [
  {
    keywords: ["bmt", "basic military training", "what is bmt"],
    question: "What is BMT like?",
    answer: "Basic Military Training (BMT) is the foundational 2-3 month training phase at Pulau Tekong. You'll learn basic soldiering skills including weapon handling, field craft, first aid, and physical training. The training is progressive — it starts lighter and builds up. Your section of ~12 people will become your core support group throughout BMT.",
  },
  {
    keywords: ["phone", "handphone", "mobile", "bring phone"],
    question: "Can I bring my phone to camp?",
    answer: "Yes, you can bring your personal phone. However, phone usage is restricted to specific times (usually during admin time and after training hours). Phones must be surrendered during certain security-sensitive activities. Camera usage may be restricted in certain areas. Your section commander will brief you on the specific rules.",
  },
  {
    keywords: ["ooc", "out of course", "fail", "cannot continue"],
    question: "What happens if I OOC (Out of Course)?",
    answer: "If you OOC due to injury, you will be sent to a holding company to recover, then re-coursed into a new BMT batch. If OOC is due to a medical condition, you may be referred for a PES review which could change your fitness classification. OOC is not a failure — it happens to many recruits and is part of ensuring your safety during training.",
  },
  {
    keywords: ["ippt", "fitness test", "pass ippt", "scoring"],
    question: "How does IPPT scoring work?",
    answer: "IPPT consists of three components: push-ups (1 minute), sit-ups (1 minute), and a 2.4km run. Each component is scored out of 25 points (run out of 50), for a maximum of 100. Pass is 51-60 points, Pass with Incentive is 61-74, Silver is 75-84, and Gold is 85 or higher. The incentive bands are $0, $200, $300, and $500 respectively.",
  },
  {
    keywords: ["pes", "physical employment status", "pes status"],
    question: "What do the PES grades mean?",
    answer: "PES (Physical Employment Status) determines what vocations you're eligible for. PES A/B1: combat-fit roles (infantry, guards, armour). PES B2: combat-fit with some limitations. PES C: non-combat roles (admin, logistics). PES E: temporary medical exemption. Your PES is determined during the pre-enlistment medical checkup and can be reviewed if your condition changes.",
  },
  {
    keywords: ["food", "cookhouse", "meals", "eat", "diet"],
    question: "What is the food like?",
    answer: "All meals are provided at the cookhouse (camp cafeteria). The menu rotates and typically includes rice, noodles, vegetables, and a protein option. There are halal and vegetarian options available. The food quality has improved significantly in recent years. If you have specific dietary requirements or allergies, inform your section commander on Day 1.",
  },
  {
    keywords: ["family", "parents", "visit", "contact", "call"],
    question: "Can my family visit me?",
    answer: "Families can visit during designated visiting hours, typically on weekends. During the first 1-2 weeks (confinement period), visits may be restricted. You can call your family during admin time using your personal phone. Letters can be sent and received through the camp post system. After the confinement period, you'll typically book out on weekends.",
  },
  {
    keywords: ["book out", "go home", "weekend", "leave"],
    question: "When can I go home?",
    answer: "After the initial confinement period (typically 1-2 weeks), you'll book out most weekends — usually Friday evening and book in Sunday evening. The exact schedule depends on your training programme. During field camp or outfield exercises, book out may be postponed. Public holidays generally follow the SAF calendar for book-out privileges.",
  },
  {
    keywords: ["medical", "sick", "doctor", "mo", "injury", "injured"],
    question: "What if I get sick or injured?",
    answer: "Report to your section commander immediately. You'll be sent to the Medical Officer (MO) at the camp medical centre. For minor issues, you'll receive treatment and an MC (medical certificate) if needed. For serious injuries, you'll be evacuated to a hospital. Always report injuries early — do not try to tough it out, as this can worsen the condition.",
  },
  {
    keywords: ["religion", "pray", "worship", "religious", "halal"],
    question: "How are religious practices accommodated?",
    answer: "SAF accommodates religious practices. Muslim NSFs receive halal meals and prayer time. There are worship services available on weekends. You can bring religious items. If you have specific religious requirements, inform your section commander during the admin brief on Day 1.",
  },
  {
    keywords: ["haircut", "hair", "grooming"],
    question: "What about haircut and grooming?",
    answer: "You will receive a standard military haircut (very short) upon enlistment. Hair must be kept short throughout NS — the standard is that hair should not touch the ears or collar. Facial hair is generally not allowed. Haircuts are provided in camp at regular intervals.",
  },
  {
    keywords: ["rank", "promotion", "corporal", "sergeant"],
    question: "How do ranks and promotions work?",
    answer: "You enlist as a Recruit (REC). After BMT, depending on your performance and PES, you may be promoted to Private (PTE). Further promotions to Lance Corporal (LCP) and Corporal (CPL) depend on your vocation course performance and unit assessments. High performers may be selected for Specialist Cadet School (SCS) to become Sergeants or Officer Cadet School (OCS) to become Officers.",
  },
  {
    keywords: ["allowance", "pay", "salary", "money", "stipend"],
    question: "How much is the NS allowance?",
    answer: "NS allowance depends on your rank. As of the latest rates: Recruit receives approximately $630/month, Private ~$680/month, Lance Corporal ~$780/month, Corporal ~$880/month. Sergeants and Officers receive higher allowances. IPPT Gold holders receive additional annual incentives. These amounts may be updated — check ns.sg for current rates.",
  },
  {
    keywords: ["vocation", "posting", "after bmt", "unit"],
    question: "How is my vocation/posting decided?",
    answer: "Your vocation posting after BMT depends on several factors: your PES status, IPPT performance, educational qualifications, stated preferences, and manpower needs. You'll be informed of your posting towards the end of BMT. Common vocations include infantry, signals, logistics, medic, transport, and admin support. PES A/B1 recruits are eligible for combat vocations.",
  },
  {
    keywords: ["mental health", "stress", "counselling", "help", "struggling"],
    question: "What if I'm struggling mentally?",
    answer: "It's completely normal to find NS challenging, especially in the early weeks. SAF provides several support channels: your section commander, the unit Medical Officer, SAF Counselling Centre (1800-278-0022), and the SAF Care Line (1800-278-0033, available 24 hours). Speaking up is not a sign of weakness — it's the responsible thing to do. You can also speak to the unit's Peer Support Leader confidentially.",
  },
];

export function askChatbot(userQuery) {
  const queryLower = userQuery.toLowerCase().trim();

  // Find best match by keyword overlap
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of qaDatabase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (queryLower.includes(keyword)) {
        score += keyword.length; // longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore >= 3) {
    return {
      matched: true,
      question: bestMatch.question,
      answer: bestMatch.answer,
      source: "Verified SAF documentation",
    };
  }

  return {
    matched: false,
    question: userQuery,
    answer: FALLBACK_MESSAGE,
    source: null,
  };
}

export default { askChatbot, qaDatabase, FALLBACK_MESSAGE };
