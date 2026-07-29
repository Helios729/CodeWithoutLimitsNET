import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Loading, ErrorNotice, ProgressMeter } from '../components/Bits.jsx';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const [module, setModule] = useState(null);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .module(moduleId)
      .then((result) => !cancelled && setModule(result.module))
      .catch((err) => !cancelled && setError(err));
    api
      .quizOutline(moduleId)
      .then((result) => !cancelled && setOutline(result))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  if (error) return <div className="shell section"><ErrorNotice error={error} /></div>;
  if (!module) return <Loading what="this course" />;

  const completed = module.progress?.completedMiniLessons ?? [];
  const title = module.module_title.replace(/-L$/, '');

  return (
    <div className="shell section">
      <p className="overline">
        {module.difficulty} · {module.duration_min} minutes
      </p>
      <h1>{title}</h1>
      <p style={{ maxWidth: 700 }}>{module.description || module.tagline}</p>

      {module.demo?.active && (
        <div className="notice" style={{ marginBottom: 'var(--space-6)' }}>
          <p style={{ margin: 0 }}>
            You are reading the preview: lesson 1 is open. {module.demo.message}{' '}
            <Link to="/sign-up">Create a free account</Link> to open the rest and save your progress.
          </p>
        </div>
      )}

      {user && module.mini_lessons.length > 0 && (
        <div style={{ maxWidth: 420, marginBottom: 'var(--space-6)' }}>
          <ProgressMeter
            value={completed.length}
            max={module.mini_lessons.length}
            label={`${completed.length} of ${module.mini_lessons.length} lessons read`}
          />
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', alignItems: 'start' }}>
        <div>
          <h2>Lessons</h2>
          <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {module.mini_lessons.map((lesson) => {
              const done = completed.includes(lesson.ml);
              const locked = lesson.locked;
              return (
                <li key={lesson.ml} className="card between" style={{ gap: 'var(--space-4)' }}>
                  <div style={{ minWidth: 0 }}>
                    <p className="overline" style={{ marginBottom: 'var(--space-1)' }}>
                      Lesson {lesson.ml} · {lesson.bloom}
                    </p>
                    <h4 style={{ margin: 0 }}>{lesson.title}</h4>
                  </div>
                  {locked ? (
                    <Link to="/sign-up" className="btn btn-secondary">
                      Unlock
                    </Link>
                  ) : (
                    <Link to={`/courses/${moduleId}/lessons/${lesson.ml}`} className="btn btn-secondary">
                      {done ? 'Read again' : 'Read'}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>

          {module.learning_objectives?.length > 0 && (
            <>
              <h2 style={{ marginTop: 'var(--space-7)' }}>What you will be able to do</h2>
              <ul className="stack">
                {module.learning_objectives.map((objective) => (
                  <li key={objective} className="muted">
                    {objective}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="stack">
          <div className="card">
            <p className="overline">Check your understanding</p>
            {outline ? (
              <>
                <p className="small">
                  {outline.mini_quizzes.length} checks, {outline.totals?.questions ?? '—'} questions.
                  Pass mark {outline.passThresholdPct}%.
                </p>
                {user ? (
                  <Link to={`/courses/${moduleId}/quiz`} className="btn btn-primary btn-block">
                    Start the quiz
                  </Link>
                ) : (
                  <Link to="/sign-up" className="btn btn-primary btn-block">
                    Create an account to take it
                  </Link>
                )}
              </>
            ) : (
              <p className="small muted">The quiz for this course is not published yet.</p>
            )}
          </div>

          {module.sources?.length > 0 && (
            <div className="card">
              <p className="overline">Sources</p>
              <ul className="small stack" style={{ paddingLeft: '1.1rem', margin: 0 }}>
                {module.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.citation}
                    </a>
                    <span className="muted"> {source.access}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
