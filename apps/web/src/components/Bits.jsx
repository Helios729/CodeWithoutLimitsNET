import { Link } from 'react-router-dom';

export function ProgressMeter({ value, max = 100, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {label && (
        <div className="between small muted" style={{ marginBottom: 'var(--space-2)' }}>
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="meter"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ModuleCard({ module }) {
  const progress = module.progress;
  return (
    <Link to={`/courses/${module.module_id}`} className="card card-link">
      <p className="overline">{module.difficulty}</p>
      <h3 style={{ marginBottom: 'var(--space-2)' }}>{module.module_title.replace(/-L$/, '')}</h3>
      <p className="small" style={{ minHeight: '3.2em' }}>
        {module.tagline}
      </p>
      <div className="row small muted" style={{ marginBottom: 'var(--space-4)' }}>
        <span>{module.duration_min} min</span>
        <span aria-hidden="true">·</span>
        <span>
          {module.miniLessonCount} lesson{module.miniLessonCount === 1 ? '' : 's'}
        </span>
        {module.price_cents === 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>Free</span>
          </>
        )}
      </div>
      {progress && progress.status !== 'not_started' ? (
        <ProgressMeter
          value={progress.completedMiniLessons}
          max={module.miniLessonCount}
          label={progress.status === 'completed' ? 'Completed' : 'In progress'}
        />
      ) : (
        <span className="badge">Not started</span>
      )}
    </Link>
  );
}

export function Loading({ what = 'content' }) {
  return (
    <div className="shell section" role="status" aria-live="polite">
      <p className="muted">Loading {what}…</p>
    </div>
  );
}

export function ErrorNotice({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="notice notice-danger stack" role="alert">
      <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 500 }}>{error.message}</p>
      {error.details?.length > 0 && (
        <ul className="small muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {error.details.map((d) => (
            <li key={d.field}>
              {d.field}: {d.message}
            </li>
          ))}
        </ul>
      )}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ id, label, hint, error, ...inputProps }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input
        id={id}
        className="input"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
