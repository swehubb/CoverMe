// Computes ORD metrics. NS duration is fixed at 24 months from enlistment date.
// Signature differs from src/data/utils/ordCalculator.js which takes an explicit ordDate.

export function calculateORD(enlistmentDateString) {
  const enlist = new Date(enlistmentDateString);
  const ord = new Date(enlist);
  ord.setMonth(ord.getMonth() + 24);

  const now = new Date();
  const daysSinceEnlistment = Math.max(0, Math.floor((now - enlist) / 86400000));
  const totalDays = Math.ceil((ord - enlist) / 86400000);
  const daysToORD = Math.max(0, Math.ceil((ord - now) / 86400000));
  const percentComplete = totalDays > 0
    ? Math.min(100, Math.round((daysSinceEnlistment / totalDays) * 100))
    : 0;
  const currentWeek = Math.floor(daysSinceEnlistment / 7) + 1;

  return { daysToORD, percentComplete, currentWeek };
}

export default { calculateORD };
