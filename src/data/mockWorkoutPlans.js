// src/data/mockWorkoutPlans.js
// PES-calibrated pre-enlistment workout plans
// Used by: PreEnlistmentWorkout (Screen 7), IPPTWeekendPlanner (Screen 12)

// Pre-enlistment plans (before BMT — Screen 7)
export const preEnlistmentPlans = {
  "A": {
    pesLabel: "PES A — Combat fit (highest)",
    weeklyPlan: [
      { day: "Monday", focus: "Push-ups", exercises: [
        { name: "Standard push-ups", sets: 4, reps: 20, component: "pushUps" },
        { name: "Diamond push-ups", sets: 3, reps: 12, component: "pushUps" },
        { name: "Plank hold", sets: 3, duration: "60s", component: "core" },
      ]},
      { day: "Wednesday", focus: "Run", exercises: [
        { name: "2.4km time trial", sets: 1, reps: 1, component: "run" },
        { name: "400m intervals x 6", sets: 6, rest: "90s between", component: "run" },
      ]},
      { day: "Friday", focus: "Sit-ups + Core", exercises: [
        { name: "Sit-ups (timed 1 min)", sets: 4, reps: "max", component: "sitUps" },
        { name: "Leg raises", sets: 3, reps: 15, component: "core" },
        { name: "Russian twists", sets: 3, reps: 20, component: "core" },
      ]},
      { day: "Saturday", focus: "Full IPPT practice", exercises: [
        { name: "Push-ups (1 min)", sets: 1, reps: "max", component: "pushUps" },
        { name: "Sit-ups (1 min)", sets: 1, reps: "max", component: "sitUps" },
        { name: "2.4km run", sets: 1, reps: 1, component: "run" },
      ]},
    ],
  },
  "B1": {
    pesLabel: "PES B1 — Combat fit (standard)",
    weeklyPlan: [
      { day: "Monday", focus: "Push-ups", exercises: [
        { name: "Standard push-ups", sets: 3, reps: 15, component: "pushUps" },
        { name: "Incline push-ups (easier)", sets: 3, reps: 12, component: "pushUps" },
        { name: "Plank hold", sets: 3, duration: "45s", component: "core" },
      ]},
      { day: "Wednesday", focus: "Run", exercises: [
        { name: "2.4km at comfortable pace", sets: 1, reps: 1, component: "run" },
        { name: "200m intervals x 6", sets: 6, rest: "2 min between", component: "run" },
      ]},
      { day: "Friday", focus: "Sit-ups + Core", exercises: [
        { name: "Sit-ups (timed 1 min)", sets: 3, reps: "max", component: "sitUps" },
        { name: "Crunches", sets: 3, reps: 20, component: "core" },
        { name: "Plank hold", sets: 3, duration: "45s", component: "core" },
      ]},
      { day: "Saturday (optional)", focus: "Light cardio", exercises: [
        { name: "Jog 20 minutes", sets: 1, reps: 1, component: "run" },
        { name: "Stretching 10 minutes", sets: 1, reps: 1, component: "recovery" },
      ]},
    ],
  },
  "B2": {
    pesLabel: "PES B2 — Combat fit (with limitations)",
    weeklyPlan: [
      { day: "Monday", focus: "Upper body", exercises: [
        { name: "Wall push-ups", sets: 3, reps: 12, component: "pushUps" },
        { name: "Knee push-ups", sets: 3, reps: 10, component: "pushUps" },
        { name: "Plank hold", sets: 3, duration: "30s", component: "core" },
      ]},
      { day: "Wednesday", focus: "Cardio", exercises: [
        { name: "Brisk walk 30 minutes", sets: 1, reps: 1, component: "run" },
        { name: "Light jog 10 minutes", sets: 1, reps: 1, component: "run" },
      ]},
      { day: "Friday", focus: "Core", exercises: [
        { name: "Sit-ups (untimed)", sets: 3, reps: 15, component: "sitUps" },
        { name: "Dead bug", sets: 3, reps: 10, component: "core" },
      ]},
    ],
  },
  "C": {
    pesLabel: "PES C — Non-combat fit",
    weeklyPlan: [
      { day: "Tuesday", focus: "Light fitness", exercises: [
        { name: "Brisk walk 20 minutes", sets: 1, reps: 1, component: "run" },
        { name: "Wall push-ups", sets: 2, reps: 10, component: "pushUps" },
      ]},
      { day: "Thursday", focus: "Core stability", exercises: [
        { name: "Gentle sit-ups", sets: 2, reps: 10, component: "sitUps" },
        { name: "Plank hold", sets: 2, duration: "20s", component: "core" },
      ]},
    ],
  },
};

// Weekend planner templates (Screen 12) — selected based on weakest component
export const weekendPlanTemplates = {
  pushUps: {
    title: "IPPT WEEKEND PUSH-UP FOCUS SESSION",
    focusArea: "Push-ups (your weakest component)",
    estimatedDuration: "45 minutes",
    warmUp: "5 min jog + arm circles + shoulder stretches",
    mainSet: [
      { name: "Standard push-ups", sets: 4, reps: "max (1 min each)", rest: "90s" },
      { name: "Wide push-ups", sets: 3, reps: 12, rest: "60s" },
      { name: "Close-grip push-ups", sets: 3, reps: 10, rest: "60s" },
    ],
    supplementary: [
      { name: "Sit-ups", sets: 2, reps: 20 },
      { name: "Light jog", duration: "10 min" },
    ],
    coolDown: "5 min walk + upper body stretches",
  },
  sitUps: {
    title: "IPPT WEEKEND CORE FOCUS SESSION",
    focusArea: "Sit-ups (your weakest component)",
    estimatedDuration: "45 minutes",
    warmUp: "5 min jog + torso twists + hip flexor stretches",
    mainSet: [
      { name: "Timed sit-ups", sets: 4, reps: "max (1 min each)", rest: "90s" },
      { name: "Crunches", sets: 3, reps: 25, rest: "60s" },
      { name: "Leg raises", sets: 3, reps: 15, rest: "60s" },
    ],
    supplementary: [
      { name: "Push-ups", sets: 2, reps: 15 },
      { name: "Light jog", duration: "10 min" },
    ],
    coolDown: "5 min walk + core stretches",
  },
  run: {
    title: "IPPT WEEKEND RUN FOCUS SESSION",
    focusArea: "2.4km run (your weakest component)",
    estimatedDuration: "50 minutes",
    warmUp: "5 min brisk walk + dynamic leg stretches",
    mainSet: [
      { name: "400m intervals", sets: 6, reps: 1, rest: "2 min walk between" },
      { name: "1.2km tempo run", sets: 2, reps: 1, rest: "3 min walk between" },
    ],
    supplementary: [
      { name: "Push-ups", sets: 2, reps: 15 },
      { name: "Sit-ups", sets: 2, reps: 20 },
    ],
    coolDown: "5 min walk + hamstring and calf stretches",
  },
};

export default { preEnlistmentPlans, weekendPlanTemplates };
