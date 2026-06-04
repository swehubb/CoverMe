export const peerWallPosts = [
  {
    id: 'wall-01',
    author: 'Anonymous NSF',
    topic: 'Homesick',
    title: 'Still homesick in week 3. Does it actually get better?',
    content: 'Week 3 and I still think about home every night. Does it settle down after a while?',
    createdAt: '2027-01-19T23:15:00',
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
    topic: 'Fitness',
    title: 'Small routine that helped me stop failing push-ups',
    content: 'Went from failing push-ups to passing by doing short nightly sets. Consistency is the main thing.',
    createdAt: '2027-01-18T21:10:00',
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
    topic: 'Stress',
    title: 'How do you reset after guard duty nights?',
    content: 'Guard duty nights make it hard to switch off. Curious how others reset after a rough shift.',
    createdAt: '2027-01-17T02:30:00',
    upvotes: 8,
    downvotes: 0,
    replies: [],
  },
  {
    id: 'wall-04',
    author: 'Almost ORD',
    topic: 'General',
    title: 'First few months felt the slowest for me',
    content: 'The first few months felt the slowest. Once your section rhythm clicks, time really starts moving.',
    createdAt: '2027-01-16T19:00:00',
    upvotes: 17,
    downvotes: 2,
    replies: [],
  },
];

export const wallTopics = ['Stress', 'Fitness', 'Homesick', 'General'];

export default { peerWallPosts, wallTopics };
