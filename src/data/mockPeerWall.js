export const peerWallPosts = [
  {
    id: 'wall-01',
    author: 'Anonymous NSF',
    phase: 'bmt',
    topic: 'Homesick',
    title: 'Still homesick in week 3. Does it actually get better?',
    content: 'Week 3 and I still think about home every night. Does it settle down after a while?',
    createdAt: '2027-01-19T23:15:00',
    distressFlag: false,
    upvotes: 14,
    downvotes: 1,
    replies: [
      {
        id: 'wall-01-r1',
        author: 'Section Mate 7',
        text: 'It did for me after the first book-out rhythm became familiar. Calling home on the same night each week helped a lot.',
        createdAt: '2027-01-20T08:10:00',
      },
      {
        id: 'wall-01-r2',
        author: 'Almost ORD',
        text: 'The feeling eased once I got closer to the people in my bunk. It is normal at the start.',
        createdAt: '2027-01-20T09:45:00',
      },
    ],
  },
  {
    id: 'wall-02',
    author: 'Section Mate 7',
    phase: 'unit',
    topic: 'Fitness',
    title: 'Small routine that helped me stop failing push-ups',
    content: 'Went from failing push-ups to passing by doing short nightly sets. Consistency is the main thing.',
    createdAt: '2027-01-18T21:10:00',
    distressFlag: false,
    upvotes: 11,
    downvotes: 0,
    replies: [
      {
        id: 'wall-02-r1',
        author: 'Night Shift NSF',
        text: 'Did you track reps or just go by feel each night?',
        createdAt: '2027-01-18T22:00:00',
      },
    ],
  },
  {
    id: 'wall-03',
    author: 'Night Shift NSF',
    phase: 'unit',
    topic: 'Stress',
    title: 'How do you reset after guard duty nights?',
    content: 'Guard duty nights make it hard to switch off. Curious how others reset after a rough shift.',
    createdAt: '2027-01-17T02:30:00',
    distressFlag: false,
    upvotes: 8,
    downvotes: 0,
    replies: [],
  },
  {
    id: 'wall-04',
    author: 'Almost ORD',
    phase: 'ord',
    topic: 'General',
    title: 'First few months felt the slowest for me',
    content: 'The first few months felt the slowest. Once your section rhythm clicks, time really starts moving.',
    createdAt: '2027-01-16T19:00:00',
    distressFlag: false,
    upvotes: 17,
    downvotes: 2,
    replies: [],
  },
  {
    id: 'wall-05',
    author: 'Pre-Enlistee',
    phase: 'pre-enlist',
    topic: 'Stress',
    title: 'Enlisting next month and the nerves are real',
    content: 'Reporting to Tekong next month. Mind keeps running through everything that could go wrong. Anyone else felt this before BMT?',
    createdAt: '2027-01-15T20:40:00',
    distressFlag: false,
    upvotes: 9,
    downvotes: 0,
    replies: [
      {
        id: 'wall-05-r1',
        author: 'Section Mate 7',
        text: 'Felt exactly the same the week before. The first few days are mostly admin and settling in — far less scary than your head makes it.',
        createdAt: '2027-01-15T21:30:00',
      },
    ],
  },
];

export const wallTopics = ['Stress', 'Fitness', 'Homesick', 'General'];

// Service phases used for the Peer Support Wall filter tabs.
export const wallPhases = [
  { value: 'pre-enlist', label: 'Pre-Enlist' },
  { value: 'bmt', label: 'BMT' },
  { value: 'unit', label: 'Unit' },
  { value: 'ord', label: 'ORD' },
];

export default { peerWallPosts, wallTopics, wallPhases };
