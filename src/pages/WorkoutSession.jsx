import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Panel from '../components/ui/Panel';
import { formatExerciseDetail, isRunExercise, weekdayOf } from '../data/workoutLibrary';

function buildRows(exercises) {
  return exercises.map((ex) => {
    if (isRunExercise(ex.name)) {
      return {
        type: 'run',
        duration: ex.targetDuration != null ? String(ex.targetDuration) : ex.targetReps != null ? String(ex.targetReps) : '',
        notes: '',
        done: false,
      };
    }
    const count = Math.max(1, ex.targetSets || 1);
    return {
      type: 'strength',
      sets: Array.from({ length: count }, () => ({
        reps: ex.targetReps != null ? String(ex.targetReps) : '',
        weight: '',
        done: false,
      })),
    };
  });
}

function fmtTime(totalSeconds) {
  const mm = `${Math.floor(totalSeconds / 60)}`.padStart(2, '0');
  const ss = `${totalSeconds % 60}`.padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function WorkoutSession({ state, updateState }) {
  const { date } = useParams();
  const navigate = useNavigate();

  // The scheduled date drives which weekday template this session uses.
  const sessionDate = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const day = Number.isNaN(sessionDate.getTime()) ? null : weekdayOf(sessionDate);

  const plan = state.workout?.plan || null;
  const dayPlan = day ? plan?.weekTemplate?.[day] || null : null;
  const exercises = dayPlan?.exercises || [];
  const valid = Boolean(plan && dayPlan && exercises.length);

  const [rows, setRows] = useState(() => (valid ? buildRows(exercises) : []));
  const [seconds, setSeconds] = useState(0);
  const [showDiscard, setShowDiscard] = useState(false);
  const timerRef = useRef(null);

  // Live session timer. The interval id lives in a ref so it is created exactly
  // once and never re-created across the per-second display re-renders.
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const addWorkoutLog = (log) =>
    updateState((current) => ({
      ...current,
      workout: { ...current.workout, logs: [...current.workout.logs, log] },
    }));

  const completedSetCount = useMemo(
    () =>
      rows.reduce((sum, row) => {
        if (row.type === 'run') return sum + (row.done ? 1 : 0);
        return sum + row.sets.filter((s) => s.done).length;
      }, 0),
    [rows],
  );

  if (!valid) return <Navigate to="/enlist/workout" replace />;

  // ---- row mutations --------------------------------------------------------
  const updateSet = (exIdx, setIdx, field, value) =>
    setRows((prev) =>
      prev.map((row, i) =>
        i !== exIdx ? row : { ...row, sets: row.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) },
      ),
    );
  const toggleSet = (exIdx, setIdx) =>
    setRows((prev) =>
      prev.map((row, i) =>
        i !== exIdx ? row : { ...row, sets: row.sets.map((s, j) => (j === setIdx ? { ...s, done: !s.done } : s)) },
      ),
    );
  const addSet = (exIdx) =>
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== exIdx) return row;
        const last = row.sets[row.sets.length - 1];
        return { ...row, sets: [...row.sets, { reps: last?.reps || '', weight: last?.weight || '', done: false }] };
      }),
    );
  const updateRun = (exIdx, field, value) =>
    setRows((prev) => prev.map((row, i) => (i === exIdx ? { ...row, [field]: value } : row)));
  const toggleRun = (exIdx) =>
    setRows((prev) => prev.map((row, i) => (i === exIdx ? { ...row, done: !row.done } : row)));

  // ---- save / discard -------------------------------------------------------
  const buildSessionExercises = () => {
    const out = [];
    rows.forEach((row, i) => {
      const name = exercises[i].name;
      if (row.type === 'run') {
        if (!row.done) return;
        out.push({
          name,
          notes: row.notes || '',
          sets: [{ reps: row.duration === '' ? null : Number(row.duration), weight: null }],
        });
        return;
      }
      const checked = row.sets.filter((s) => s.done);
      if (checked.length === 0) return;
      out.push({
        name,
        sets: checked.map((s) => ({
          reps: s.reps === '' ? null : Number(s.reps),
          weight: s.weight === '' ? null : Number(s.weight),
        })),
      });
    });
    return out;
  };

  const endWorkout = () => {
    addWorkoutLog({
      id: Date.now(),
      date: new Date().toISOString(),
      day,
      focus: dayPlan.focus || '',
      exercises: buildSessionExercises(),
      completed: true,
      discarded: false,
    });
    navigate('/enlist/workout');
  };

  const discardWorkout = () => {
    addWorkoutLog({
      id: Date.now(),
      date: new Date().toISOString(),
      day,
      focus: dayPlan.focus || '',
      exercises: [],
      completed: false,
      discarded: true,
    });
    navigate('/enlist/workout');
  };

  return (
    <div className="wk-session scroll">
      <div className="wk-session-head">
        <button className="wk-back" onClick={() => navigate('/enlist/workout')} aria-label="Back">‹</button>
        <div>
          <div className="label" style={{ color: 'var(--accent-text)' }}>▲ WORKOUT SESSION</div>
          <h1 className="h-display wk-session-title">{day} · {(dayPlan.focus || '').toUpperCase()}</h1>
        </div>
        <div className="wk-timer mono">{fmtTime(seconds)}</div>
      </div>

      <div className="wk-session-body">
        {exercises.map((ex, exIdx) => {
          const row = rows[exIdx];
          const run = row.type === 'run';
          return (
            <Panel key={`${ex.name}-${exIdx}`} className="wk-ex-card">
              <div className="wk-ex-head">
                <span className="h-title wk-ex-title">{ex.name}</span>
                <span className="mono-dim">Target: {formatExerciseDetail(ex)}</span>
              </div>

              {run ? (
                <div className="wk-run-fields">
                  <div className="field">
                    <span className="stat-label">DURATION (MIN)</span>
                    <input
                      className="inp"
                      type="number"
                      inputMode="numeric"
                      value={row.duration}
                      placeholder="min"
                      onChange={(e) => updateRun(exIdx, 'duration', e.target.value)}
                    />
                  </div>
                  <div className="field wk-run-notes">
                    <span className="stat-label">NOTES</span>
                    <input
                      className="inp"
                      type="text"
                      value={row.notes}
                      placeholder="Pace, route, how it felt…"
                      onChange={(e) => updateRun(exIdx, 'notes', e.target.value)}
                    />
                  </div>
                  <button
                    className={`wk-set-check${row.done ? ' done' : ''}`}
                    onClick={() => toggleRun(exIdx)}
                    aria-label="Mark run done"
                  >✓</button>
                </div>
              ) : (
                <div className="wk-set-table">
                  <div className="wk-set-row wk-set-header mono-dim">
                    <span>SET</span><span>REPS</span><span>WEIGHT (KG)</span><span>✓</span>
                  </div>
                  {row.sets.map((s, setIdx) => (
                    <div key={setIdx} className={`wk-set-row${s.done ? ' done' : ''}`}>
                      <span className="wk-set-num mono">{setIdx + 1}</span>
                      <input
                        className="inp wk-set-inp"
                        type="number"
                        inputMode="numeric"
                        value={s.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      />
                      <input
                        className="inp wk-set-inp"
                        type="number"
                        inputMode="numeric"
                        value={s.weight}
                        placeholder="BW"
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                      />
                      <button
                        className={`wk-set-check${s.done ? ' done' : ''}`}
                        onClick={() => toggleSet(exIdx, setIdx)}
                        aria-label={`Mark set ${setIdx + 1} done`}
                      >✓</button>
                    </div>
                  ))}
                  <button className="wk-add-set" onClick={() => addSet(exIdx)}>+ Add Set</button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <div className="wk-session-actions">
        <button className="btn full lg wk-end" onClick={endWorkout}>END WORKOUT</button>
        <button className="btn neutral full wk-discard" onClick={() => setShowDiscard(true)}>DISCARD</button>
        <div className="wk-session-summary mono-dim">{completedSetCount} sets logged · {fmtTime(seconds)} elapsed</div>
      </div>

      {showDiscard && (
        <div className="wk-modal-overlay" onClick={() => setShowDiscard(false)}>
          <Panel elevated className="wk-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h-title" style={{ fontSize: 22, marginBottom: 10 }}>Discard this session?</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>Your progress will not be saved.</p>
            <div className="wk-modal-actions">
              <button className="btn neutral" onClick={() => setShowDiscard(false)}>KEEP GOING</button>
              <button className="btn danger" onClick={discardWorkout}>DISCARD</button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
