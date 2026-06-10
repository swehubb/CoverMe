// src/data/workoutLibrary.js
// Pre-enlistment workout feature (Enlist module).
//
// HARD CONSTRAINT: every exercise the app shows — default templates AND
// AI-recommended plans — must come from EXERCISE_LIBRARY below. The backend prompt
// enforces the same list; this file is the single client-side source of truth.

export const EXERCISE_LIBRARY = {
  pushUps: ['Normal pushups', 'Diamond pushups', 'Wide-arm pushups', 'Negative pushups', 'Knees on ground pushups'],
  sitUps: ['Situps', 'Leg raises', 'Bicycle crunches', 'Flutter kicks', 'Russian twists'],
  runs: ['Interval run', 'Tempo run', 'Aerobic run'],
};

export const RUN_EXERCISES = new Set(EXERCISE_LIBRARY.runs);
export const ALL_EXERCISES = new Set([
  ...EXERCISE_LIBRARY.pushUps,
  ...EXERCISE_LIBRARY.sitUps,
  ...EXERCISE_LIBRARY.runs,
]);

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function isRunExercise(name) {
  return RUN_EXERCISES.has(name);
}

// Drops any exercise the model invented outside the allowed library — defence in
// depth so an off-spec AI response can never render an unsupported movement.
export function sanitisePlanExercises(exercises) {
  if (!Array.isArray(exercises)) return [];
  return exercises.filter((ex) => ex && ALL_EXERCISES.has(ex.name));
}

// Strength movement: targetSets x targetReps.
function strength(name, targetSets, targetReps) {
  return { name, targetSets, targetReps, targetDuration: null, detail: `${targetSets} × ${targetReps}` };
}
// Run by duration (minutes).
function runFor(name, minutes) {
  return { name, targetSets: 1, targetReps: null, targetDuration: minutes, detail: `${minutes} min` };
}
// Run by interval count (e.g. 6 × 400m).
function intervals(name, count, metres) {
  return { name, targetSets: count, targetReps: null, targetDuration: null, detail: `${count} × ${metres}m` };
}

const rest = { focus: 'Rest', exercises: [] };

// PES is grouped into three training bands. PES C templates never prescribe a
// running variant other than Aerobic run, nor Diamond/Wide-arm pushups.
const TEMPLATES = {
  AB1: {
    Monday: { focus: 'Push Day', exercises: [strength('Normal pushups', 3, 15), strength('Diamond pushups', 3, 10), strength('Situps', 3, 20), strength('Leg raises', 3, 15)] },
    Tuesday: { focus: 'Run', exercises: [intervals('Interval run', 6, 400)] },
    Wednesday: { focus: 'Core', exercises: [strength('Bicycle crunches', 3, 20), strength('Flutter kicks', 3, 20), strength('Russian twists', 3, 20)] },
    Thursday: { focus: 'Push', exercises: [strength('Wide-arm pushups', 3, 15), strength('Negative pushups', 3, 8), strength('Situps', 3, 25)] },
    Friday: { focus: 'Run', exercises: [runFor('Tempo run', 20)] },
    Saturday: { focus: 'Full', exercises: [strength('Normal pushups', 3, 20), strength('Situps', 3, 20), runFor('Aerobic run', 30)] },
    Sunday: rest,
  },
  B2B3: {
    Monday: { focus: 'Push', exercises: [strength('Normal pushups', 3, 10), strength('Knees on ground pushups', 3, 12), strength('Situps', 3, 15)] },
    Tuesday: { focus: 'Run', exercises: [runFor('Aerobic run', 20)] },
    Wednesday: { focus: 'Core', exercises: [strength('Bicycle crunches', 3, 15), strength('Flutter kicks', 3, 15)] },
    Thursday: { focus: 'Push', exercises: [strength('Normal pushups', 3, 12), strength('Situps', 3, 18)] },
    Friday: { focus: 'Run', exercises: [runFor('Aerobic run', 25)] },
    Saturday: { focus: 'Full', exercises: [strength('Normal pushups', 3, 15), strength('Situps', 3, 20), runFor('Aerobic run', 20)] },
    Sunday: rest,
  },
  C: {
    Monday: { focus: 'Core', exercises: [strength('Knees on ground pushups', 2, 10), strength('Situps', 2, 15)] },
    Tuesday: { focus: 'Walk / Jog', exercises: [runFor('Aerobic run', 15)] },
    Wednesday: rest,
    Thursday: { focus: 'Core', exercises: [strength('Bicycle crunches', 2, 12), strength('Flutter kicks', 2, 12)] },
    Friday: { focus: 'Walk / Jog', exercises: [runFor('Aerobic run', 15)] },
    Saturday: { focus: 'Light Full', exercises: [strength('Knees on ground pushups', 2, 12), strength('Situps', 2, 15)] },
    Sunday: rest,
  },
};

// Map a raw PES status string to a template band.
export function pesBand(pes) {
  const value = (pes || '').toString().toUpperCase().trim();
  if (value === 'A' || value === 'B1') return 'AB1';
  if (value === 'B2' || value === 'B3') return 'B2B3';
  return 'C'; // C, E, F, or anything unrecognised → gentlest band
}

// A weekly template keyed Monday→Sunday: { Monday: { focus, exercises }, ... }.
// This is the reusable shape the rolling dated queue is expanded from.
export function buildDefaultWeekTemplate(pes) {
  const band = TEMPLATES[pesBand(pes)];
  const days = {};
  DAYS.forEach((day) => {
    const template = band[day] || rest;
    days[day] = {
      focus: template.focus,
      exercises: template.exercises.map((ex) => ({ ...ex })),
    };
  });
  return days;
}

// Builds a fresh default plan: { generatedAt, weekTemplate }.
export function buildDefaultPlan(pes) {
  return { generatedAt: new Date().toISOString(), weekTemplate: buildDefaultWeekTemplate(pes) };
}

// Restrict a weekly template to exactly `daysPerWeek` training days, placed on
// consecutive weekdays starting Monday (the rest become rest days). Keeps the
// plan honest to the volume the user asked for, regardless of how the template
// — or the AI — laid out its training vs rest days.
export function restrictTemplateToDays(weekTemplate, daysPerWeek) {
  const n = Math.max(1, Math.min(DAYS.length, Number(daysPerWeek) || DAYS.length));
  // Real training day-plans, in Monday→Sunday order.
  const trainingPlans = DAYS
    .map((day) => weekTemplate?.[day])
    .filter((dayPlan) => !isRestTemplateDay(dayPlan));
  const chosen = trainingPlans.slice(0, n);
  const days = {};
  DAYS.forEach((day, i) => {
    days[day] = i < chosen.length
      ? { focus: chosen[i].focus, exercises: chosen[i].exercises.map((ex) => ({ ...ex })) }
      : { focus: 'Rest', exercises: [] };
  });
  return days;
}

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weekday name for a Date (matches the keys used in a week template).
export function weekdayOf(date) {
  return WEEKDAY_NAMES[(date instanceof Date ? date : new Date(date)).getDay()];
}

// True when a template day is a rest day (no exercises / focus says rest).
export function isRestTemplateDay(dayPlan) {
  return !dayPlan || !Array.isArray(dayPlan.exercises) || dayPlan.exercises.length === 0 || /rest/i.test(dayPlan.focus || '');
}

// Human-readable target for a plan exercise — tolerant of AI output that only
// carries { name, targetSets, targetReps }.
export function formatExerciseDetail(ex) {
  if (!ex) return '';
  if (ex.detail) return ex.detail;
  if (isRunExercise(ex.name)) {
    if (ex.targetDuration) return `${ex.targetDuration} min`;
    if (ex.targetSets > 1) return `${ex.targetSets} intervals`;
    if (ex.targetReps) return `${ex.targetReps} min`;
    return 'Run';
  }
  return `${ex.targetSets ?? 1} × ${ex.targetReps ?? '—'}`;
}

export default {
  EXERCISE_LIBRARY,
  RUN_EXERCISES,
  ALL_EXERCISES,
  DAYS,
  WEEKDAY_NAMES,
  isRunExercise,
  sanitisePlanExercises,
  pesBand,
  buildDefaultWeekTemplate,
  buildDefaultPlan,
  restrictTemplateToDays,
  weekdayOf,
  isRestTemplateDay,
  formatExerciseDetail,
};
