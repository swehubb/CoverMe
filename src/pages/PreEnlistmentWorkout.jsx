import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import nlpService from '../services/nlpService';
import {
  DAYS,
  buildDefaultPlan,
  formatExerciseDetail,
  isRestTemplateDay,
  isRunExercise,
  restrictTemplateToDays,
  sanitisePlanExercises,
  weekdayOf,
} from '../data/workoutLibrary';

const STREAK_WEEKS = 12;
const QUEUE_HORIZON_DAYS = 28; // how far ahead to project the dated queue

// ---- local date helpers -----------------------------------------------------
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
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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
function mmss(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '';
  return `${Math.floor(totalSeconds / 60)}:${`${totalSeconds % 60}`.padStart(2, '0')}`;
}
function dateLabel(date, today) {
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  return date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

function normaliseDays(rawDays) {
  const days = {};
  DAYS.forEach((day) => {
    const entry = rawDays?.[day];
    const exercises = sanitisePlanExercises(entry?.exercises);
    days[day] = {
      focus: exercises.length ? entry?.focus || 'Training' : 'Rest',
      exercises,
    };
  });
  return days;
}

// Collapsible section header. The label + chevron is the toggle; any children
// render as a right-aligned tools cluster (and don't trigger the collapse).
function SectionHead({ id, label, collapsed, onToggle, children }) {
  return (
    <div className="wk-section-head">
      <button
        type="button"
        className="wk-section-toggle"
        onClick={() => onToggle(id)}
        aria-expanded={!collapsed}
      >
        <span className={`wk-section-chevron${collapsed ? ' collapsed' : ''}`}>▾</span>
        <span className="label">{label}</span>
      </button>
      {children && <div className="wk-section-tools">{children}</div>}
    </div>
  );
}

export default function PreEnlistmentWorkout({ state, updateState }) {
  const navigate = useNavigate();
  const pes = state.auth.profile?.pesStatus || 'B1';
  const goal = state.onboarding?.ipptGoal || 'Pass';

  const intake = state.workout?.intake || null;
  const plan = state.workout?.plan || null;
  const logs = state.workout?.logs || [];

  const [generating, setGenerating] = useState(false);
  const [editingIntake, setEditingIntake] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const completedLogs = useMemo(() => logs.filter(isCompletedLog), [logs]);
  const lastCompletedDate = completedLogs.length ? completedLogs[completedLogs.length - 1].date : null;

  const setIntake = (values) =>
    updateState((current) => ({ ...current, workout: { ...current.workout, intake: values } }));
  const setPlan = (next) =>
    updateState((current) => ({ ...current, workout: { ...current.workout, plan: next } }));

  // Build / refresh the weekly template. Runs once an intake exists, and again
  // whenever a workout is completed after the current plan was generated — so the
  // progressive overload only ever lands on FUTURE dated sessions, never the one
  // just finished (which has already dropped into history).
  useEffect(() => {
    if (!intake) return undefined;
    const needsPlan = !plan;
    const stale = plan && lastCompletedDate && new Date(lastCompletedDate) > new Date(plan.generatedAt);
    if (!needsPlan && !stale) return undefined;

    let active = true;
    setGenerating(true);
    nlpService
      .recommendWorkout({ pes, goal, intake, recentLogs: completedLogs.slice(-5) })
      .then((res) => {
        if (!active) return;
        setGenerating(false);
        const days = res && !res.useDefault ? normaliseDays(res.days) : buildDefaultPlan(pes).weekTemplate;
        // Hard-cap to the volume the user asked for, Monday-first.
        setPlan({ generatedAt: new Date().toISOString(), weekTemplate: restrictTemplateToDays(days, intake.daysPerWeek) });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intake, pes, goal, lastCompletedDate, plan?.generatedAt]);

  const today = startOfToday();
  const todayKey = localKey(today);

  const completedDates = useMemo(
    () => new Set(completedLogs.map((log) => localKey(log.date))),
    [completedLogs],
  );

  // Project the weekly template forward into dated sessions, skipping rest days
  // and any date already completed.
  const queue = useMemo(() => {
    if (!plan?.weekTemplate) return [];
    const visible = Math.max(1, intake.daysPerWeek || 1); // only show as many as they train per week
    const out = [];
    for (let i = 0; i < QUEUE_HORIZON_DAYS && out.length < visible; i += 1) {
      const date = addDays(today, i);
      const key = localKey(date);
      if (completedDates.has(key)) continue;
      const dayPlan = plan.weekTemplate[weekdayOf(date)];
      if (isRestTemplateDay(dayPlan)) continue;
      out.push({ key, date, weekday: weekdayOf(date), focus: dayPlan.focus, exercises: dayPlan.exercises, isToday: key === todayKey });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.generatedAt, plan?.weekTemplate, completedDates, todayKey, intake.daysPerWeek]);

  const todayIsTrainingDay = plan?.weekTemplate && !isRestTemplateDay(plan.weekTemplate[weekdayOf(today)]);
  const todayDone = completedDates.has(todayKey);

  // streak + calendar (date-based)
  const dayStatus = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      const key = localKey(log.date);
      const status = isCompletedLog(log) ? 'full' : 'partial';
      if (status === 'full' || !map.has(key)) map.set(key, status);
    });
    return map;
  }, [logs]);
  const weekStart = startOfWeekMonday(today);
  const { currentStreak, longestStreak } = useMemo(
    () => computeWeeklyStreaks(completedLogs, intake.daysPerWeek, today),
    [completedLogs, intake.daysPerWeek, todayKey],
  );
  const calendarWeeks = useMemo(() => buildCalendar(dayStatus, weekStart), [dayStatus, weekStart.getTime()]);
  const history = useMemo(() => [...completedLogs].reverse(), [completedLogs]);

  // ── Intake gate ─────────────────────────────────────────────
  if (!intake || editingIntake) {
    return (
      <IntakeForm
        pes={pes}
        goal={goal}
        latestAttempt={state.ippt?.attempts?.[state.ippt.attempts.length - 1] || null}
        initial={intake}
        onCancel={intake ? () => setEditingIntake(false) : null}
        onSubmit={(values) => {
          setIntake(values);
          setPlan(null); // force a fresh AI build from the new inputs
          setEditingIntake(false);
        }}
      />
    );
  }

  return (
    <div className="wk-page scroll">
      <div className="wk-head">
        <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · PRE-ENLISTMENT CONDITIONING</div>
        <h1 className="h-display wk-title">PRE-ENLISTMENT WORKOUT</h1>
        <p className="wk-sub">
          Tuned to <span className="wk-pes">{pes}</span> · goal <span className="wk-pes">{goal.toUpperCase()}</span> · {intake.daysPerWeek}×/week · {intake.sessionMinutes} min. Plan adapts forward with progressive overload as you log sessions.
        </p>
      </div>

      {/* ── SECTION A — UP NEXT (rolling dated queue) ─────────── */}
      <section className="wk-section">
        <SectionHead id="upnext" label="▲ UP NEXT" collapsed={collapsed.upnext} onToggle={toggleSection}>
          {generating && <span className="mono-dim wk-generating"><span className="blink">●</span> BUILDING YOUR PLAN…</span>}
          <button className="wk-link-btn" onClick={() => setEditingIntake(true)}>ADJUST INPUTS</button>
        </SectionHead>

        {collapsed.upnext ? null : !plan ? (
          <Panel className="wk-empty"><p className="mono-dim">Building your plan from your inputs…</p></Panel>
        ) : (
          <>
            {todayIsTrainingDay && todayDone && (
              <Panel flush className="wk-today-done"><span className="wk-check sm">✓</span> Today's session is logged. Next up below.</Panel>
            )}
            {queue.length === 0 ? (
              <Panel className="wk-empty"><p className="mono-dim">Rest day — nothing scheduled. Enjoy the recovery.</p></Panel>
            ) : (
              <div className="wk-q-row">
                {queue.map((session) => {
                  const expanded = expandedKey === session.key;
                  return (
                    <Panel key={session.key} className={`wk-q-card${session.isToday ? ' is-today' : ''}`}>
                      <div className="wk-q-top">
                        <div>
                          <div className="wk-q-date h-title">{dateLabel(session.date, today)}</div>
                          <div className="wk-q-focus mono-dim">{(session.focus || '').toUpperCase()}</div>
                        </div>
                        {session.isToday && <span className="wk-today-tag">TODAY</span>}
                      </div>
                      <ul className="wk-ex-list">
                        {(expanded ? session.exercises : session.exercises.slice(0, 3)).map((ex, i) => (
                          <li key={`${ex.name}-${i}`}>
                            <span className="wk-ex-name">{ex.name}</span>
                            <span className="wk-ex-detail mono">{formatExerciseDetail(ex)}</span>
                          </li>
                        ))}
                      </ul>
                      {session.exercises.length > 3 && (
                        <button className="wk-expand" onClick={() => setExpandedKey(expanded ? null : session.key)}>
                          {expanded ? '▲ less' : `▾ ${session.exercises.length - 3} more`}
                        </button>
                      )}
                      <button className="btn sm full wk-start" onClick={() => navigate(`/enlist/workout-session/${session.key}`)}>
                        START WORKOUT
                      </button>
                    </Panel>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── SECTION B — STREAK CALENDAR ───────────────────────── */}
      <section className="wk-section">
        <SectionHead id="streak" label="▲ YOUR STREAK" collapsed={collapsed.streak} onToggle={toggleSection} />
        {!collapsed.streak && (
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
              <span className="label">WEEK STREAK</span>
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
        )}
      </section>

      {/* ── SECTION C — HISTORY ───────────────────────────────── */}
      <section className="wk-section">
        <SectionHead id="history" label="▲ PAST WORKOUTS" collapsed={collapsed.history} onToggle={toggleSection}>
          {history.length > 0 && <span className="mono-dim wk-section-count">{history.length}</span>}
        </SectionHead>
        {collapsed.history ? null : history.length === 0 ? (
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

// ── Intake form ───────────────────────────────────────────────
function IntakeForm({ pes, goal, latestAttempt, initial, onSubmit, onCancel }) {
  const [pushups, setPushups] = useState(
    initial?.pushups != null ? String(initial.pushups) : latestAttempt?.pushups != null ? String(latestAttempt.pushups) : '',
  );
  const [situps, setSitups] = useState(
    initial?.situps != null ? String(initial.situps) : latestAttempt?.situps != null ? String(latestAttempt.situps) : '',
  );
  const [runMmss, setRunMmss] = useState(
    initial?.runMmss || (latestAttempt?.runSeconds != null ? mmss(latestAttempt.runSeconds) : ''),
  );
  const [sessionMinutes, setSessionMinutes] = useState(String(initial?.sessionMinutes ?? 45));
  const [daysPerWeek, setDaysPerWeek] = useState(String(initial?.daysPerWeek ?? 4));
  const [error, setError] = useState('');

  const submit = () => {
    const runOk = /^\d{1,2}:[0-5]\d$/.test(runMmss.trim());
    if (pushups === '' || situps === '' || !runOk) {
      setError('Enter your push-ups, sit-ups, and a valid 2.4km time (mm:ss, e.g. 11:30).');
      return;
    }
    onSubmit({
      pushups: Number(pushups),
      situps: Number(situps),
      runMmss: runMmss.trim(),
      sessionMinutes: Number(sessionMinutes),
      daysPerWeek: Number(daysPerWeek),
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="wk-page scroll">
      <div className="wk-head">
        <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · PRE-ENLISTMENT CONDITIONING</div>
        <h1 className="h-display wk-title">{initial ? 'ADJUST YOUR INPUTS' : 'SET UP YOUR PLAN'}</h1>
        <p className="wk-sub">
          A few numbers so the AI can craft a plan for your <span className="wk-pes">{pes}</span> status and <span className="wk-pes">{goal.toUpperCase()}</span> goal. It refines forward every time you log a session.
        </p>
      </div>

      <Panel ticks className="wk-intake-card">
        <div className="label" style={{ marginBottom: 14 }}>▲ CURRENT BASELINE</div>
        <div className="wk-intake-grid">
          <div className="field">
            <span className="stat-label">PUSH-UPS IN 60S</span>
            <input className="inp" type="number" inputMode="numeric" value={pushups} onChange={(e) => setPushups(e.target.value)} placeholder="e.g. 38" />
          </div>
          <div className="field">
            <span className="stat-label">SIT-UPS IN 60S</span>
            <input className="inp" type="number" inputMode="numeric" value={situps} onChange={(e) => setSitups(e.target.value)} placeholder="e.g. 41" />
          </div>
          <div className="field">
            <span className="stat-label">2.4KM RUN (MM:SS)</span>
            <input className="inp" type="text" value={runMmss} onChange={(e) => setRunMmss(e.target.value)} placeholder="e.g. 11:30" />
          </div>
        </div>

        <div className="label" style={{ margin: '22px 0 14px' }}>▲ TRAINING PREFERENCES</div>
        <div className="wk-intake-grid">
          <div className="field">
            <span className="stat-label">MINUTES PER SESSION</span>
            <select className="inp" value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)}>
              {[20, 30, 45, 60, 75, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div className="field">
            <span className="stat-label">SESSIONS PER WEEK</span>
            <select className="inp" value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)}>
              {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div className="field">
            <span className="stat-label">IPPT GOAL</span>
            <input className="inp" type="text" value={goal} disabled />
          </div>
        </div>

        {error && <p className="wk-intake-error">{error}</p>}

        <div className="wk-intake-actions">
          {onCancel && <button className="btn neutral" onClick={onCancel}>CANCEL</button>}
          <button className="btn" onClick={submit}>{initial ? 'REBUILD PLAN' : 'BUILD MY PLAN'}</button>
        </div>
      </Panel>
    </div>
  );
}

// Weekly streak = consecutive weeks (Monday→Sunday) in which the user hit their
// target number of sessions. Finish all your sessions for the week and the week
// counts as 1; chain weeks to grow the streak. The in-progress current week
// never breaks the streak before it's over — it only extends it once met.
function computeWeeklyStreaks(completedLogs, daysPerWeek, today) {
  const target = Math.max(1, Number(daysPerWeek) || 1);
  const perWeek = new Map(); // monday-key -> completed session count
  completedLogs.forEach((log) => {
    const wk = localKey(startOfWeekMonday(new Date(log.date)));
    perWeek.set(wk, (perWeek.get(wk) || 0) + 1);
  });
  const met = (mondayKey) => (perWeek.get(mondayKey) || 0) >= target;

  // Current streak: walk back week by week from this week. If the current week
  // isn't met yet, start from last week so an unfinished week doesn't reset it.
  let current = 0;
  const cursor = startOfWeekMonday(today);
  if (!met(localKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  while (met(localKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  // Longest run of consecutive met weeks across all history.
  const metMondays = [...perWeek.keys()].filter(met).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  metMondays.forEach((key) => {
    const d = new Date(key);
    if (prev && Math.round((d - prev) / 86400000) === 7) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  });
  return { currentStreak: current, longestStreak: longest };
}

// 12 week rows (oldest → newest), Monday→Sunday, ending on the current week.
function buildCalendar(dayStatus, weekStart) {
  const today = startOfToday();
  const firstMonday = addDays(weekStart, -(STREAK_WEEKS - 1) * 7);
  const weeks = [];
  for (let w = 0; w < STREAK_WEEKS; w += 1) {
    const row = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(firstMonday, w * 7 + d);
      const key = localKey(date);
      row.push({ key, status: dayStatus.get(key) || 'none', isToday: key === localKey(today), isFuture: date > today });
    }
    weeks.push(row);
  }
  return weeks;
}
