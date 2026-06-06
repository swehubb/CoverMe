import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateIPPT } from '../utils/ipptScoring';

// Plan A: push-up focused, Plan B: core focused, Plan C: interval run
const PLANS = {
  pushups: {
    name: 'Push-Up Power Plan',
    focus: 'Upper body strength',
    days: [
      {
        day: 'Saturday',
        sessions: ['4 × 15 push-ups (1 min rest)', 'Diamond push-ups 3 × 10', '20 min easy jog'],
      },
      {
        day: 'Sunday',
        sessions: ['5 × max-rep push-ups', 'Incline push-ups 3 × 12', 'Core: 3 × 20 sit-ups'],
      },
    ],
  },
  situps: {
    name: 'Core Power Plan',
    focus: 'Abdominal endurance',
    days: [
      {
        day: 'Saturday',
        sessions: ['4 × 20 sit-ups', 'Flutter kicks 3 × 30 s', 'Hollow-body hold 3 × 20 s'],
      },
      {
        day: 'Sunday',
        sessions: ['5 × max-rep sit-ups', 'Crunches 4 × 15', '20 min easy jog'],
      },
    ],
  },
  run: {
    name: '2.4km Interval Plan',
    focus: 'Run pace and endurance',
    days: [
      {
        day: 'Saturday',
        sessions: ['10 min warm-up jog', '4 × 400 m at target pace (90 s rest)', '10 min cool-down walk'],
      },
      {
        day: 'Sunday',
        sessions: ['30 min steady-state run', 'Strides 4 × 100 m', 'Core: 3 × 20 sit-ups'],
      },
    ],
  },
};

// Per-component point targets for each goal award (push-ups 0-25, sit-ups 0-25, run 0-50)
const TARGETS = {
  gold:   { pushups: 20, situps: 20, run: 45 },
  silver: { pushups: 18, situps: 18, run: 39 },
  pass:   { pushups: 13, situps: 13, run: 25 },
};

function deriveScores(log) {
  if (log.pushupScore != null) {
    return { pushupScore: log.pushupScore, situpScore: log.situpScore, runScore: log.runScore };
  }
  // Old log format uses pushUps/sitUps/runSeconds — recalculate from reps
  const pushups = log.pushUps ?? log.pushups ?? 0;
  const situps  = log.sitUps  ?? log.situps  ?? 0;
  const secs    = log.runSeconds ?? 9999;
  const mm      = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss      = String(secs % 60).padStart(2, '0');
  const r = calculateIPPT({ pushups, situps, runTime: `${mm}:${ss}` });
  return { pushupScore: r.pushupScore, situpScore: r.situpScore, runScore: r.runScore };
}

function getTotal(log) {
  return log.total ?? log.totalScore ?? 0;
}

export default function WeekendPlanner() {
  const { ipptLogs } = useAppContext();
  const { user }     = useAuth();

  const goal    = (user?.ipptGoal || 'pass').toLowerCase();
  const targets = TARGETS[goal] ?? TARGETS.pass;

  let selectedPlan = PLANS.run;
  let pbScores     = { pushupScore: 0, situpScore: 0, runScore: 0 };

  if (ipptLogs.length > 0) {
    const pb = ipptLogs.reduce((best, log) => (getTotal(log) > getTotal(best) ? log : best), ipptLogs[0]);
    pbScores = deriveScores(pb);

    // Find weakest component by average across all logs
    // Normalise run (0-50) to (0-25) before comparing
    const sums = ipptLogs.reduce(
      (acc, log) => {
        const s = deriveScores(log);
        acc.pushups += s.pushupScore;
        acc.situps  += s.situpScore;
        acc.run     += s.runScore / 2;
        return acc;
      },
      { pushups: 0, situps: 0, run: 0 },
    );
    const n = ipptLogs.length;
    const weakest = Object.entries({ pushups: sums.pushups / n, situps: sums.situps / n, run: sums.run / n })
      .sort(([, a], [, b]) => a - b)[0][0];
    selectedPlan = PLANS[weakest];
  }

  const statRows = [
    { label: 'Push-ups (pts)', current: pbScores.pushupScore, target: targets.pushups },
    { label: 'Sit-ups (pts)',  current: pbScores.situpScore,  target: targets.situps  },
    { label: 'Run (pts)',      current: pbScores.runScore,     target: targets.run     },
  ];

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Serve · Performance</p>
        <h1>Your Weekend Plan</h1>
        <div className="rule" />
      </header>

      {/* Current vs target stats */}
      <div className="calculator-card" style={{ marginBottom: '12px' }}>
        <p className="kicker">Current PB vs Target ({goal})</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ textAlign: 'left',   padding: '6px 0',  fontWeight: 400 }}>Component</th>
              <th style={{ textAlign: 'right',  padding: '6px 4px', fontWeight: 400 }}>PB</th>
              <th style={{ textAlign: 'right',  padding: '6px 4px', fontWeight: 400 }}>Target</th>
              <th style={{ textAlign: 'right',  padding: '6px 0',  fontWeight: 400 }}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {statRows.map((row) => {
              const gap = row.target - row.current;
              return (
                <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0' }}>{row.label}</td>
                  <td style={{ textAlign: 'right', padding: '8px 4px', fontFamily: 'var(--font-mono)' }}>{row.current}</td>
                  <td style={{ textAlign: 'right', padding: '8px 4px', fontFamily: 'var(--font-mono)' }}>{row.target}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'var(--font-mono)', color: gap <= 0 ? '#4a7c59' : 'var(--text-primary)' }}>
                    {gap <= 0 ? 'Done' : `+${gap}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommended plan */}
      <div className="weekend-planner-card static">
        <div className="weekend-planner-topline">
          <h3>{selectedPlan.name}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedPlan.focus}</span>
        </div>
        {selectedPlan.days.map((dayPlan) => (
          <div key={dayPlan.day} style={{ marginBottom: '14px' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', letterSpacing: '0.04em', margin: '0 0 6px' }}>
              {dayPlan.day.toUpperCase()}
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {dayPlan.sessions.map((s) => (
                <li key={s} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
        Plan updates as you log more attempts.
      </p>
    </section>
  );
}
