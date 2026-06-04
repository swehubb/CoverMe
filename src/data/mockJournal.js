export const journalEntries = [
  {
    id: 'journal-01',
    date: '2027-01-07',
    prompt: 'How are you ending today?',
    text: 'First day back from book out. Feeling rested and more settled than last month.',
    sentimentScore: 0.81,
  },
  {
    id: 'journal-02',
    date: '2027-01-11',
    prompt: 'What carried the most weight for you today?',
    text: 'PT was tough but manageable. Section mates kept the mood light so it felt easier.',
    sentimentScore: 0.74,
  },
  {
    id: 'journal-03',
    date: '2027-01-15',
    prompt: 'How are you starting today?',
    text: 'Back in camp after a rough week, but the routine is helping me reset.',
    sentimentScore: 0.57,
  },
  {
    id: 'journal-04',
    date: '2027-01-20',
    prompt: 'What carried the most weight for you today?',
    text: 'Logged IPPT progress and felt proud that the score is finally moving up.',
    sentimentScore: 0.84,
  },
];

export const journalPrompts = [
  'How are you ending today?',
  'What carried the most weight for you today?',
  'How are you starting today?',
  "What's one thing you handled well today?",
  'What would you tell a friend going through your day?',
];

export default { journalEntries, journalPrompts };
