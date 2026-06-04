// src/utils/ordCalculator.js
// Calculate ORD-related metrics from enlistment date
// Used by: ORDCountdown component, ServiceProfile component

export function calculateORD(enlistmentDate, ordDate) {
  const enlist = new Date(enlistmentDate);
  const ord = new Date(ordDate);
  const now = new Date();

  const totalDays = Math.ceil((ord - enlist) / (1000 * 60 * 60 * 24));
  const daysServed = Math.max(0, Math.ceil((now - enlist) / (1000 * 60 * 60 * 24)));
  const daysToORD = Math.max(0, Math.ceil((ord - now) / (1000 * 60 * 60 * 24)));
  const percentComplete = Math.min(100, Math.round((daysServed / totalDays) * 100));
  const currentWeek = Math.max(1, Math.ceil(daysServed / 7));

  // Milestone calculation
  const daysToEnlistment = Math.max(0, Math.ceil((enlist - now) / (1000 * 60 * 60 * 24)));
  const hasEnlisted = now >= enlist;

  return {
    totalDays,
    daysServed,
    daysToORD,
    daysToEnlistment,
    percentComplete,
    currentWeek,
    hasEnlisted,
    ordDateFormatted: ord.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }),
    enlistmentDateFormatted: enlist.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }),
  };
}

export default { calculateORD };
