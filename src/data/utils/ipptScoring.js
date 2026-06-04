// src/utils/ipptScoring.js
// Calculate IPPT score from raw performance numbers
// Used by: LogIPPTStats (Screen 10), IPPTWeekendPlanner (Screen 12)

import { pushUpScoring, sitUpScoring, runScoring, IPPT_THRESHOLDS } from "../data/ipptStandards";

export function calculatePushUpScore(reps) {
  for (const entry of pushUpScoring) {
    if (reps >= entry.reps) return entry.points;
  }
  return 0;
}

export function calculateSitUpScore(reps) {
  for (const entry of sitUpScoring) {
    if (reps >= entry.reps) return entry.points;
  }
  return 0;
}

export function calculateRunScore(seconds) {
  for (const entry of runScoring) {
    if (seconds <= entry.maxSeconds) return entry.points;
  }
  return 0;
}

export function calculateTotal(pushUps, sitUps, runSeconds) {
  const puScore = calculatePushUpScore(pushUps);
  const suScore = calculateSitUpScore(sitUps);
  const runScore = calculateRunScore(runSeconds);
  const total = puScore + suScore + runScore;

  let award = "fail";
  if (total >= IPPT_THRESHOLDS.gold) award = "gold";
  else if (total >= IPPT_THRESHOLDS.silver) award = "silver";
  else if (total >= IPPT_THRESHOLDS.pass) award = "pass";

  return {
    pushUpScore: puScore,
    sitUpScore: suScore,
    runScore: runScore,
    totalScore: total,
    award,
  };
}

// Format run time from seconds to MM:SS
export function formatRunTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Parse run time from MM:SS to seconds
export function parseRunTime(timeStr) {
  const [mins, secs] = timeStr.split(":").map(Number);
  return mins * 60 + (secs || 0);
}

// Find the weakest component from logged attempts (for weekend planner)
export function findWeakestComponent(attempts) {
  if (!attempts || attempts.length === 0) return "run";

  const latest = attempts[attempts.length - 1];
  const scores = {
    pushUps: latest.pushUpScore,
    sitUps: latest.sitUpScore,
    run: latest.runScore,
  };

  return Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
}

export default { calculateTotal, calculatePushUpScore, calculateSitUpScore, calculateRunScore, formatRunTime, parseRunTime, findWeakestComponent };
