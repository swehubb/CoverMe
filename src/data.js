export const starterQuestions = [
  'What happens if I fail IPPT?',
  'What should I pack for BMT?',
  'What is OOC and will it affect me?',
  'How do I apply for a medical review?',
];

export const peerPosts = [
  {
    id: 1,
    username: 'Infantry_Bro_2023',
    recency: '8 months ago',
    vocation: 'Infantry',
    unitType: 'Combat',
    batch: '23/24',
    verified: true,
    body:
      'First two weeks were admin heavy, but field pack discipline matters from day one. Label everything and keep spare ziplock bags. That saved me more than anything else.',
  },
  {
    id: 2,
    username: 'Signals_NS_Notes',
    recency: '5 months ago',
    vocation: 'Signals',
    unitType: 'Support',
    batch: '24/24',
    verified: true,
    body:
      'Ask early about course timelines and bring a notebook you will actually use. The small details move fast once you start vocational training.',
  },
  {
    id: 3,
    username: 'Medic_Watch',
    recency: '3 months ago',
    vocation: 'Medic',
    unitType: 'Service',
    batch: '24/25',
    verified: true,
    body:
      'You do not need to pretend you know everything on day one. Stay methodical, ask questions, and keep your admin documents organised.',
  },
];

export const unitRoster = [
  'CPL Lim Jun Jie',
  'PTE Muhammad Irfan',
  'LCP Ong Kai Wen',
  'REC Joel Tan',
  'PFC Arvind Raj',
];

export const trainingActivity = [
  {
    id: 1,
    name: 'CPL Lim Jun Jie',
    unit: '3 SIR',
    recency: '2h ago',
    headline: 'New 2.4km PB',
    statline: '10:38',
    detail: 'Cut 14 seconds off his last timing and hit Silver range.',
    chips: ['2.4km', 'PB', 'Silver'],
    reactions: { cheer: 12, fire: 4, respect: 6 },
    userReaction: '',
    comments: [
      { id: 101, author: 'PTE Muhammad Irfan', text: 'Solid pacing. That last lap looked stronger.', recency: '1h ago' },
    ],
  },
  {
    id: 2,
    name: 'PTE Muhammad Irfan',
    unit: 'Signals',
    recency: 'Yesterday',
    headline: 'Push-up best',
    statline: '48 reps',
    detail: 'Closed the gap after two weeks of volume work.',
    chips: ['Push-ups', 'PB', '+6'],
    reactions: { cheer: 9, fire: 2, respect: 3 },
    userReaction: '',
    comments: [
      { id: 102, author: 'CPL Lim Jun Jie', text: 'Volume block paying off already.', recency: 'Yesterday' },
    ],
  },
  {
    id: 3,
    name: 'LCP Ong Kai Wen',
    unit: 'HQ Coy',
    recency: '2 days ago',
    headline: 'Projected Gold',
    statline: '86 pts',
    detail: 'Strong sit-up session plus a cleaner pace split on the run.',
    chips: ['IPPT', 'Gold', 'Projection'],
    reactions: { cheer: 15, fire: 7, respect: 8 },
    userReaction: '',
    comments: [],
  },
];

export const whatToExpect = [
  'Bring only what your enlistment instructions require and keep your documents easy to access.',
  'Expect identity checks, equipment issue, haircut, orientation briefs, and a highly structured first day.',
  'Listen carefully during admin briefings. Reporting instructions, medical declarations, and bunk discipline matter immediately.',
  'The first week is about adjustment. Routine, punctuality, hydration, and basic kit discipline will carry you a long way.',
];

export const wellnessPrompts = [
  'How are you ending today?',
  'What carried the most weight for you today?',
  'What felt steady today, even briefly?',
  'What do you want to leave behind before tomorrow begins?',
];

export function buildTrainingPlan(pesStatus, goal, currentScore = 0, vocation = 'General') {
  const intensityMap = {
    Pass: 'Foundation build focused on consistency and injury-safe conditioning.',
    'Pass with Incentive': 'Progressive conditioning focused on pace control and volume growth.',
    Silver: 'Balanced conditioning plan focused on stronger pacing, repeatability, and cleaner event form.',
    Gold: 'High-discipline conditioning plan focused on performance gains and timing efficiency.',
  };
  const goalTargets = {
    Pass: 55,
    'Pass with Incentive': 68,
    Silver: 80,
    Gold: 90,
  };
  const targetScore = goalTargets[goal] || 55;
  const scoreGap = Math.max(0, targetScore - currentScore);
  const weekendFocusMap = {
    Infantry: {
      sat: 'Add loaded-march posture work, lower-body durability drills, and easy aerobic volume.',
      sun: 'Use recovery time for foot care, mobility, and kit-carry prep.',
    },
    Signals: {
      sat: 'Add posture resets, shoulder endurance, and easy aerobic volume for long standing hours.',
      sun: 'Use recovery time for neck mobility, core stability, and easy reset work.',
    },
    Medic: {
      sat: 'Add lower-back durability, carry strength, and easy aerobic volume.',
      sun: 'Use recovery time for mobility, hydration, and standing-tolerance reset work.',
    },
    General: {
      sat: 'Add vocation-readiness mobility and easy aerobic volume.',
      sun: 'Use recovery time for mobility, reset work, and injury prevention.',
    },
  };
  const weekendFocus = weekendFocusMap[vocation] || weekendFocusMap.General;

  const highGap = [
    ['Mon', '4x10 push-ups, 4x18 sit-ups, 24 min steady jog', '45 min'],
    ['Tue', 'Mobility work, brisk walk, planks, breathing reset', '30 min'],
    ['Wed', 'Intervals: 6 x 400m, bodyweight circuit, recovery walk', '50 min'],
    ['Thu', 'Stretching, light core activation, form drills', '25 min'],
    ['Fri', '2.4km paced effort, push-up ladder, sit-up ladder', '50 min'],
    ['Sat', 'Long easy run, lower-body mobility, cooldown walk', '55 min'],
    ['Sun', 'Rest and recovery', '20 min'],
  ];

  const midGap = [
    ['Mon', '3x14 push-ups, 3x24 sit-ups, 22 min jog', '40 min'],
    ['Tue', 'Mobility work, planks, hip stability drills', '28 min'],
    ['Wed', 'Intervals: 5 x 400m, short strength circuit', '44 min'],
    ['Thu', 'Recovery stretch and posture reset', '22 min'],
    ['Fri', '2.4km tempo run, push-up ladder, sit-up ladder', '46 min'],
    ['Sat', 'Long easy run and lower-body mobility', '48 min'],
    ['Sun', 'Rest and recovery', '20 min'],
  ];

  const lowGap = [
    ['Mon', '3x16 push-ups, 3x26 sit-ups, 20 min jog', '38 min'],
    ['Tue', 'Mobility work, planks, shoulder activation', '24 min'],
    ['Wed', 'Intervals: 4 x 400m, bodyweight maintenance circuit', '40 min'],
    ['Thu', 'Recovery stretch and breath control work', '20 min'],
    ['Fri', '2.4km pace rehearsal, push-up ladder, sit-up ladder', '42 min'],
    ['Sat', 'Easy run, mobility, cooldown walk', '42 min'],
    ['Sun', 'Rest and recovery', '18 min'],
  ];

  const base = scoreGap >= 18 ? highGap : scoreGap >= 8 ? midGap : lowGap;

  return {
    summary: `${intensityMap[goal] || intensityMap.Pass} ${vocation} weekend prep included. Current score ${currentScore}. Target ${targetScore}. Gap ${scoreGap}.`,
    days: base.map(([label, workout, duration], index) => ({
      id: `${label}-${index}`,
      label,
      workout:
        pesStatus === 'E' || pesStatus === 'C'
          ? `${withWeekendFocus(label, workout, weekendFocus)} (adjust for medical guidance)`
          : withWeekendFocus(label, workout, weekendFocus),
      duration,
    })),
  };
}

function withWeekendFocus(label, workout, weekendFocus) {
  if (label === 'Sat') return `${workout} ${weekendFocus.sat}`;
  if (label === 'Sun') return `${workout} ${weekendFocus.sun}`;
  return workout;
}
