import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateIPPT } from '../utils/ipptScoring';

// Register chart elements not already covered by App.jsx's global ChartJS.register call
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

const GOAL_TARGETS = { gold: 85, silver: 75, pass: 51 };

function getTotal(log) {
  return log.total ?? log.totalScore ?? 0;
}

function getAward(total) {
  if (total >= 85) return 'Gold';
  if (total >= 75) return 'Silver';
  if (total >= 51) return 'Pass';
  return 'Fail';
}

export default function IPPTTracker() {
  const navigate = useNavigate();
  const { ipptLogs, addIPPTLog } = useAppContext();
  const { user } = useAuth();

  const [pushups, setPushups] = useState('');
  const [situps,  setSitups]  = useState('');
  const [runTime, setRunTime] = useState('');
  const [error,   setError]   = useState('');

  const goal        = (user?.ipptGoal || 'pass').toLowerCase();
  const targetScore = GOAL_TARGETS[goal] ?? 75;

  const personalBest = ipptLogs.length
    ? ipptLogs.reduce((best, log) => (getTotal(log) > getTotal(best) ? log : best), ipptLogs[0])
    : null;
  const pbTotal   = personalBest ? getTotal(personalBest) : 0;
  const pbAward   = personalBest?.award ?? getAward(pbTotal);
  const pointsGap = Math.max(0, targetScore - pbTotal);

  const chartData = [...ipptLogs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((log) => ({ date: (log.date ?? '').slice(5), score: getTotal(log) }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!pushups.trim() || !situps.trim() || !runTime.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(runTime.trim())) {
      setError('Run time must be in MM:SS format (e.g. 12:30).');
      return;
    }
    setError('');
    const result = calculateIPPT({
      pushups: Number(pushups),
      situps:  Number(situps),
      runTime: runTime.trim(),
    });
    addIPPTLog({
      date:        new Date().toISOString().slice(0, 10),
      pushups:     Number(pushups),
      situps:      Number(situps),
      runTime:     runTime.trim(),
      pushupScore: result.pushupScore,
      situpScore:  result.situpScore,
      runScore:    result.runScore,
      total:       result.total,
      award:       result.award,
    });
    setPushups('');
    setSitups('');
    setRunTime('');
  }

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Serve · Performance</p>
        <h1>IPPT Tracker</h1>
        <div className="rule" />
      </header>

      {/* Personal Best banner */}
      <div className="mini-panel" style={{ border: '1px solid var(--border)', background: 'var(--surface-primary)', padding: '16px', marginBottom: '12px' }}>
        <span className="kicker">Personal Best</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', lineHeight: 1 }}>
            {pbTotal || '—'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {pbTotal ? pbAward : 'No attempts yet'}
          </span>
        </div>
      </div>

      {/* Log Attempt form */}
      <div className="calculator-card" style={{ marginBottom: '12px' }}>
        <p className="kicker">Log Attempt</p>
        <form onSubmit={handleSubmit}>
          <div className="calculator-grid">
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Push-ups</span>
              <input type="number" min="0" max="100" value={pushups} onChange={(e) => setPushups(e.target.value)} placeholder="Reps" />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sit-ups</span>
              <input type="number" min="0" max="100" value={situps} onChange={(e) => setSitups(e.target.value)} placeholder="Reps" />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Run (MM:SS)</span>
              <input type="text" value={runTime} onChange={(e) => setRunTime(e.target.value)} placeholder="12:00" />
            </label>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '8px 0 0' }}>{error}</p>}
          <button type="submit" className="primary-button">Log Attempt</button>
        </form>
      </div>

      {/* Progression chart */}
      {ipptLogs.length > 0 && (
        <div className="chart-card" style={{ marginBottom: '12px' }}>
          <p className="kicker" style={{ marginBottom: '6px' }}>Progression</p>
          <Bar
            data={{
              labels: chartData.map((d) => d.date),
              datasets: [
                {
                  data: chartData.map((d) => d.score),
                  backgroundColor: 'rgba(45,74,62,0.72)',
                  borderRadius: 2,
                  label: 'Score',
                },
                {
                  data: chartData.map(() => targetScore),
                  type: 'line',
                  borderColor: '#2d4a3e',
                  borderDash: [4, 2],
                  borderWidth: 1.5,
                  pointRadius: 0,
                  fill: false,
                  label: 'Target',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, ticks: { font: { size: 10 } } },
                x: { ticks: { font: { size: 10 } } },
              },
            }}
          />
        </div>
      )}

      {/* Goal distance */}
      <div className="mini-panel" style={{ border: '1px solid var(--border)', background: 'var(--surface-accent)', padding: '14px 16px', marginBottom: '12px' }}>
        <span className="kicker">
          Goal: {goal.charAt(0).toUpperCase() + goal.slice(1)} ({targetScore} pts)
        </span>
        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem' }}>
          {pointsGap === 0 ? 'Goal achieved' : `${pointsGap} pts to go`}
        </strong>
      </div>

      <button className="primary-button" onClick={() => navigate('/serve/planner')}>
        VIEW TRAINING PLAN
      </button>
      <button className="secondary-button" onClick={() => navigate('/serve/platoon')}>
        VIEW PLATOON FEED
      </button>
    </section>
  );
}
