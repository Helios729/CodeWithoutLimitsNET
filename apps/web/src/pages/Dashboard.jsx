import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Loading, ErrorNotice, ProgressMeter } from '../components/Bits.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .dashboard()
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="shell section"><ErrorNotice error={error} /></div>;
  if (!data) return <Loading what="your learning" />;

  const { summary, modules } = data;

  return (
    <div className="shell section">
      <p className="overline">My learning</p>
      <h1>Welcome back, {user.displayName}</h1>

      <div className="grid grid-cards" style={{ margin: 'var(--space-6) 0' }}>
        <div className="card">
          <p className="overline">Started</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-h2)', margin: 0, color: 'var(--color-text-primary)' }}>
            {summary.modulesStarted}
          </p>
          <p className="small muted" style={{ margin: 0 }}>of {summary.modulesAvailable} learning modules</p>
        </div>
        <div className="card">
          <p className="overline">Completed</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--type-h2)', margin: 0, color: 'var(--color-text-primary)' }}>
            {summary.modulesCompleted}
          </p>
          <p className="small muted" style={{ margin: 0 }}>quiz passed at {summary.passThresholdPct}% or above</p>
        </div>
        <div className="card">
          <p className="overline">Where you are strong</p>
          {Object.keys(summary.bloomMastery).length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>Take a quiz and this fills in.</p>
          ) : (
            Object.entries(summary.bloomMastery).map(([level, counts]) => (
              <div key={level} style={{ marginTop: 'var(--space-3)' }}>
                <ProgressMeter
                  value={counts.correct}
                  max={counts.total}
                  label={`${level} — ${counts.correct}/${counts.total}`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <h2>Your learning modules</h2>
      {modules.length === 0 ? (
        <div className="notice">
          <p>Nothing started yet. Pick a learning module and read the first lesson.</p>
          <Link to="/courses" className="btn btn-primary">
            Browse the learning modules
          </Link>
        </div>
      ) : (
        <div className="stack">
          {modules.map((module) => (
            <div key={module.module_id} className="card between" style={{ gap: 'var(--space-5)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="overline" style={{ marginBottom: 'var(--space-1)' }}>
                  {module.difficulty}
                </p>
                <h4 style={{ marginBottom: 'var(--space-3)' }}>
                  {module.module_title.replace(/-L$/, '')}
                </h4>
                <ProgressMeter
                  value={module.completedMiniLessons}
                  max={module.totalMiniLessons}
                  label={`${module.completedMiniLessons} of ${module.totalMiniLessons} lessons`}
                />
                {module.bestModuleScorePct !== null && (
                  <p className="small muted" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                    Best quiz score {module.bestModuleScorePct}% across {module.attemptCount} attempt
                    {module.attemptCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <Link to={`/courses/${module.module_id}`} className="btn btn-secondary">
                {module.status === 'completed' ? 'Revisit' : 'Continue'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
