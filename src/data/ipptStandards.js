// src/data/ipptStandards.js
// Official IPPT scoring for NSFs (Age Group 1: ≤22 years old)
// Each component scored 0–25 points. Total: 0–100.
// Pass ≥ 51 | Silver (Incentive) ≥ 75 | Gold ≥ 85

export const IPPT_THRESHOLDS = {
  pass: 51,
  silver: 75,
  gold: 85,
  max: 100,
};

// Push-up scoring (reps → points) for age group ≤22
export const pushUpScoring = [
  { reps: 60, points: 25 },
  { reps: 57, points: 24 },
  { reps: 54, points: 23 },
  { reps: 51, points: 22 },
  { reps: 48, points: 21 },
  { reps: 45, points: 20 },
  { reps: 42, points: 19 },
  { reps: 40, points: 18 },
  { reps: 38, points: 17 },
  { reps: 36, points: 16 },
  { reps: 34, points: 15 },
  { reps: 32, points: 14 },
  { reps: 30, points: 13 },
  { reps: 28, points: 12 },
  { reps: 26, points: 11 },
  { reps: 24, points: 10 },
  { reps: 22, points: 9 },
  { reps: 20, points: 8 },
  { reps: 18, points: 7 },
  { reps: 16, points: 6 },
  { reps: 14, points: 5 },
  { reps: 12, points: 4 },
  { reps: 10, points: 3 },
  { reps: 8, points: 2 },
  { reps: 6, points: 1 },
  { reps: 0, points: 0 },
];

// Sit-up scoring (reps → points) for age group ≤22
export const sitUpScoring = [
  { reps: 60, points: 25 },
  { reps: 57, points: 24 },
  { reps: 54, points: 23 },
  { reps: 51, points: 22 },
  { reps: 48, points: 21 },
  { reps: 45, points: 20 },
  { reps: 42, points: 19 },
  { reps: 40, points: 18 },
  { reps: 38, points: 17 },
  { reps: 36, points: 16 },
  { reps: 34, points: 15 },
  { reps: 32, points: 14 },
  { reps: 30, points: 13 },
  { reps: 28, points: 12 },
  { reps: 26, points: 11 },
  { reps: 24, points: 10 },
  { reps: 22, points: 9 },
  { reps: 20, points: 8 },
  { reps: 18, points: 7 },
  { reps: 16, points: 6 },
  { reps: 14, points: 5 },
  { reps: 12, points: 4 },
  { reps: 10, points: 3 },
  { reps: 8, points: 2 },
  { reps: 6, points: 1 },
  { reps: 0, points: 0 },
];

// 2.4km run scoring (seconds → points) for age group ≤22
// Lower time = higher score
export const runScoring = [
  { maxSeconds: 510, points: 50 },  // 8:30
  { maxSeconds: 530, points: 49 },
  { maxSeconds: 540, points: 48 },  // 9:00
  { maxSeconds: 550, points: 47 },
  { maxSeconds: 560, points: 46 },
  { maxSeconds: 570, points: 45 },  // 9:30
  { maxSeconds: 580, points: 44 },
  { maxSeconds: 590, points: 43 },
  { maxSeconds: 600, points: 42 },  // 10:00
  { maxSeconds: 610, points: 41 },
  { maxSeconds: 620, points: 40 },
  { maxSeconds: 640, points: 38 },
  { maxSeconds: 660, points: 36 },  // 11:00
  { maxSeconds: 680, points: 34 },
  { maxSeconds: 700, points: 32 },
  { maxSeconds: 720, points: 30 },  // 12:00
  { maxSeconds: 740, points: 28 },
  { maxSeconds: 760, points: 26 },
  { maxSeconds: 780, points: 24 },  // 13:00
  { maxSeconds: 800, points: 22 },
  { maxSeconds: 820, points: 20 },
  { maxSeconds: 840, points: 18 },  // 14:00
  { maxSeconds: 870, points: 16 },
  { maxSeconds: 900, points: 14 },  // 15:00
  { maxSeconds: 930, points: 12 },
  { maxSeconds: 960, points: 10 },  // 16:00
  { maxSeconds: 990, points: 8 },
  { maxSeconds: 1020, points: 6 },  // 17:00
  { maxSeconds: 1050, points: 4 },
  { maxSeconds: 1080, points: 2 },  // 18:00
  { maxSeconds: 9999, points: 0 },
];

export default { IPPT_THRESHOLDS, pushUpScoring, sitUpScoring, runScoring };
