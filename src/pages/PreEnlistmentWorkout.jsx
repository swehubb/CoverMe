import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import nlpService from '../services/nlpService';
import {
  DAYS,
  buildDefaultWeekPlan,
  formatExerciseDetail,
  isRunExercise,
  sanitisePlanExercises,
} from '../data/workoutLibrary';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STREAK_WEEKS = 12;

// ---- local date helpers (kept self-contained to this screen) ----------------
function localKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - offset);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isCompletedLog(log) {
  return Boolean(log?.completed) && !log?.discarded;
}
function totalSets(log) {
  if (!Array.isArray(log?.exercises)) return 0;
  return log.exercises.reduce((sum, ex) => sum + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
}

// Normalises an AI plan's days into the canonical shape, dropping off-library
// exercises and forcing every day (incl. Sunday rest) to exist.
function normaliseDays(rawDays) {
  const days = {};
  DAYS.forEach((day) => {
    const entry = rawDays?.[day];
    const exercises = day === 'Sunday' ? [] : sanitisePlanExercises(entry?.exercises);
    days[day] = {
      focus: day === 'Sunday' ? 'Rest' : entry?.focus || (exercises.length ? 'Training' : 'Rest'),
      exercises,
    };
  });
  return days;
}

function isRestDay(dayPlan) {
  return !dayPlan || !dayPlan.exercises || dayPlan.exercises.length === 0 || /rest/i.test(dayPlan.focus || '');
}

export default function PreEnlistmentWorkout({ state, updateState }) {
  const navigate = useNavigate();
  const pes = state.auth.profile?.pesStatus || 'B1';

  const logs = state.workout?.logs || [];
  const weekPlan = state.workout?.weekPlan || null;

  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const completedLogs = useMemo(() => logs.filter(isCompletedLog), [logs]);
  const lastCompletedDate = completedLogs.length ? completedLogs[completedLogs.length - 1].date : null;

  const setWeekPlan = (plan) =>
    updateState((current) => ({ ...current, workout: { ...current.workout, weekPlan: plan } }));

  // Build / refresh the plan. Regenerates only when there is no plan yet, or when a
  // workout was completed after the current plan was generated. Renders immediately
  // with whatever plan exists; the AI call (history only) updates in the background.
  useEffect(() => {
    const needsPlan = !weekPlan;
    const stale =
      weekPlan && lastCompletedDate && new Date(lastCompletedDate) > new Date(weekPlan.generatedAt);
    if (!needsPlan && !stale) return undefined;

    if (completedLogs.length === 0) {
      setWeekPlan(buildDefaultWeekPlan(pes));
      return undefined;
    }

    let active = true;
    setGenerating(true);
    nlpService.recommendWorkout(pes, completedLogs.slice(-5)).then((res) => {
      if (!active) return;
      setGenerating(false);
      if (!res || res.useDefault) {
        setWeekPlan(buildDefaultWeekPlan(pes));
      } else {
        setWeekPlan({ generatedAt: new Date().toISOString(), days: normaliseDays(res.days) });
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pes, lastCompletedDate, weekPlan?.generatedAt, completedLogs.length]);

  const today = startOfToday();
  const todayName = DAY_NAMES[today.getDay()];
  const weekStart = startOfWeekMonday(today);
  const weekEnd = addDays(weekStart, 6);

  // Which weekday names have a completed (non-discarded) log within the CURRENT week.
  const completedDaysThisWeek = useMemo(() => {
    const set = new Set();
    completedLogs.forEach((log) => {
      const d = new Date(log.date);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (day >= weekStart && day <= weekEnd) set.add(log.day);
    });
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedLogs, weekStart.getTime()]);

  // Per-day status map for the streak calendar: 'full' (completed), 'partial'
  // (only a discarded/incomplete attempt), or absent.
  const dayStatus = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      const key = localKey(log.date);
      const status = isCompletedLog(log) ? 'full' : 'partial';
      if (status === 'full' || !map.has(key)) map.set(key, status);
    });
    return map;
  }, [logs]);

  const { currentStreak, longestStreak } = useMemo(() => computeStreaks(dayStatus, today), [dayStatus, today.getTime()]);

  const calendarWeeks = useMemo(() => buildCalendar(dayStatus, weekStart), [dayStatus, weekStart.getTime()]);

  const history = useMemo(() => [...completedLogs].reverse(), [completedLogs]);

  return (
    <div className="wk-page scroll">
      <div className="wk-head">
        <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · PRE-ENLISTMENT CONDITIONING</div>
        <h1 className="h-display wk-title">PRE-ENLISTMENT WORKOUT</h1>
        <p className="wk-sub">
          Calibrated to <span className="wk-pes">{pes}</span>. Plan adapts with progressive overload each time you finish a session.
        </p>
      </div>

      {/* ── SECTION A — WEEKLY PLAN ───────────────────────────── */}
      <section className="wk-section">
        <div className="wk-section-head">
          <span className="label">▲ THIS WEEK'S PLAN</span>
          {generating && <span className="mono-dim wk-generating"><span className="blink">●</span> BUILDING YOUR PLAN…</span>}
        </div>

        {!weekPlan ? (
          <Panel className="wk-empty"><p className="mono-dim">Building your plan…</p></Panel>
        ) : (
          <div className="wk-day-row">
            {DAYS.map((day) => {
              const dayPlan = weekPlan.days?.[day];
              const rest = isRestDay(dayPlan);
              const isToday = day === todayName;
              const done = completedDaysThisWeek.has(day);
              const expanded = expandedDay === day;
              return (
                <Panel
                  key={day}
                  className={`wk-day-card${isToday ? ' is-today' : ''}${rest ? ' is-rest' : ''}`}
                >
                  <div className="wk-day-top">
                    <div>
                      <div className="wk-day-name h-title">{day.slice(0, 3)}{isToday && <span className="wk-today-tag">TODAY</span>}</div>
                      <div className="wk-day-focus mono-dim">{rest ? 'REST' : (dayPlan.focus || '').toUpperCase()}</div>
                    </div>
                    {done && <span className="wk-check" title="Completed this week">✓</span>}
                  </div>

                  {!rest && (
                    <>
                      <ul className="wk-ex-list">
                        {(expanded ? dayPlan.exercises : dayPlan.exercises.slice(0, 3)).map((ex, i) => (
                          <li key={`${ex.name}-${i}`}>
                            <span className="wk-ex-name">{ex.name}</span>
                            <span className="wk-ex-detail mono">{formatExerciseDetail(ex)}</span>
                          </li>
                        ))}
                      </ul>
                      {dayPlan.exercises.length > 3 && (
                        <button className="wk-expand" onClick={() => setExpandedDay(expanded ? null : day)}>
                          {expanded ? '▲ less' : `▾ ${dayPlan.exercises.length - 3} more`}
                        </button>
                      )}
                      <button className="btn sm full wk-start" onClick={() => navigate(`/enlist/workout-session/${day}`)}>
                        START WORKOUT
                      </button>
                    </>
                  )}
                  {rest && <div className="wk-rest-note mono-dim">Recovery · no session</div>}
                </Panel>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SECTION B — STREAK CALENDAR ───────────────────────── */}
      <section className="wk-section">
        <div className="wk-section-head"><span className="label">▲ YOUR STREAK</span></div>
        <Panel className="wk-streak-card">
          <div className="wk-streak-grid-wrap">
            <div className="wk-streak-weekdays">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="wk-streak-grid">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="wk-streak-week">
                  {week.map((cell) => (
                    <span
                      key={cell.key}
                      className={`wk-cell wk-cell-${cell.status}${cell.isToday ? ' is-today' : ''}${cell.isFuture ? ' is-future' : ''}`}
                      title={cell.isFuture ? '' : `${cell.key} · ${cell.status === 'full' ? 'Completed' : cell.status === 'partial' ? 'Partial' : 'No workout'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="wk-streak-stats">
            <div className="wk-streak-stat">
              <span className="stat-val" style={{ fontSize: 34, color: 'var(--amber)' }}>{currentStreak}</span>
              <span className="label">DAY STREAK</span>
            </div>
            <div className="wk-streak-stat">
              <span className="stat-val" style={{ fontSize: 34, color: 'var(--text)' }}>{longestStreak}</span>
              <span className="label">LONGEST</span>
            </div>
            <div className="wk-streak-legend mono-dim">
              <span>Less</span>
              <span className="wk-cell wk-cell-none" />
              <span className="wk-cell wk-cell-partial" />
              <span className="wk-cell wk-cell-full" />
              <span>More</span>
            </div>
          </div>
        </Panel>
      </section>

      {/* ── SECTION C — HISTORY ───────────────────────────────── */}
      <section className="wk-section">
        <div className="wk-section-head"><span className="label">▲ PAST WORKOUTS</span></div>
        {history.length === 0 ? (
          <Panel className="wk-empty"><p className="mono-dim">No workouts logged yet. Start your first session above.</p></Panel>
        ) : (
          <div className="wk-history">
            {history.map((log) => {
              const open = expandedLog === log.id;
              return (
                <Panel key={log.id} className={`wk-log${open ? ' open' : ''}`}>
                  <button className="wk-log-summary" onClick={() => setExpandedLog(open ? null : log.id)}>
                    <div className="wk-log-meta">
                      <span className="wk-log-date mono">{new Date(log.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</span>
                      <span className="wk-log-day h-title">{log.day}</span>
                      {log.focus && <span className="wk-log-focus mono-dim">{log.focus.toUpperCase()}</span>}
                    </div>
                    <div className="wk-log-right">
                      <span className="mono-dim">{totalSets(log)} sets</span>
                      <span className={`wk-log-chevron${open ? ' open' : ''}`}>▾</span>
                    </div>
                  </button>
                  <div className="wk-log-body" style={{ maxHeight: open ? 600 : 0 }}>
                    <div className="wk-log-body-inner">
                      {log.exercises.map((ex, ei) => (
                        <div key={ei} className="wk-log-ex">
                          <div className="wk-log-ex-name">{ex.name}</div>
                          <div className="wk-log-sets">
                            {ex.sets.map((s, si) => (
                              <span key={si} className="wk-log-set mono">
                                {isRunExercise(ex.name)
                                  ? `${s.reps ?? '—'} min`
                                  : `${s.reps ?? '—'}${s.weight != null ? ` × ${s.weight}kg` : ''}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// Current streak = consecutive completed days ending today or yesterday.
// Longest streak = longest run of consecutive completed days ever.
function computeStreaks(dayStatus, today) {
  const completedKeys = new Set(
    [...dayStatus.entries()].filter(([, status]) => status === 'full').map(([key]) => key),
  );

  // current
  let current = 0;
  const cursor = new Date(today);
  if (!completedKeys.has(localKey(cursor))) cursor.setDate(cursor.getDate() - 1); // allow today-not-yet-done
  while (completedKeys.has(localKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest
  const sorted = [...completedKeys].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  sorted.forEach((key) => {
    const d = new Date(key);
    if (prev && Math.round((d - prev) / 86400000) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  });

  return { currentStreak: current, longestStreak: longest };
}

// 12 week rows (oldest → newest), each Monday→Sunday, ending on the current week.
function buildCalendar(dayStatus, weekStart) {
  const today = startOfToday();
  const firstMonday = addDays(weekStart, -(STREAK_WEEKS - 1) * 7);
  const weeks = [];
  for (let w = 0; w < STREAK_WEEKS; w += 1) {
    const row = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(firstMonday, w * 7 + d);
      const key = localKey(date);
      row.push({
        key,
        status: dayStatus.get(key) || 'none',
        isToday: key === localKey(today),
        isFuture: date > today,
      });
    }
    weeks.push(row);
  }
  return weeks;
}
