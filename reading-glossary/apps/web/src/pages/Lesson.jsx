import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Loading, ErrorNotice } from '../components/Bits.jsx';

export default function Lesson() {
  const { moduleId, ml } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [error, setError] = useState(null);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .module(moduleId)
      .then((result) => !cancelled && setModule(result.module))
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const lesson = useMemo(
    () => module?.mini_lessons.find((l) => l.ml === Number(ml)),
    [module, ml]
  );

  useEffect(() => {
    setMarked(Boolean(module?.progress?.completedMiniLessons?.includes(Number(ml))));
  }, [module, ml]);

  if (error) return <div className="shell section"><ErrorNotice error={error} /></div>;
  if (!module) return <Loading what="the lesson" />;

  if (!lesson || lesson.locked) {
    return (
      <div className="shell section">
        <div className="notice">
          <h2>This lesson is not open yet</h2>
          <p>Create a free account to read the whole course and keep your place.</p>
          <Link to="/sign-up" className="btn btn-primary">
            Create a free account
          </Link>
        </div>
      </div>
    );
  }

  const next = module.mini_lessons.find((l) => l.ml === lesson.ml + 1);

  const markRead = async () => {
    setMarked(true);
    try {
      await api.completeLesson(moduleId, lesson.ml);
    } catch {
      setMarked(false);
    }
  };

  return (
    <article className="shell section" style={{ maxWidth: 760 }}>
      <p className="overline">
        <Link to={`/courses/${moduleId}`}>{module.module_title.replace(/-L$/, '')}</Link> · Lesson{' '}
        {lesson.ml} of {module.mini_lessons.length}
      </p>
      <h1>{lesson.title}</h1>

      {lesson.concepts.map((concept) => (
        <section key={concept.title} style={{ marginTop: 'var(--space-7)' }}>
          <h2>{concept.title}</h2>
          <p style={{ color: 'var(--color-text-primary)' }}>{concept.explanation}</p>

          {concept.worked_example && (
            <div className="card" style={{ background: 'var(--color-background-secondary)' }}>
              <p className="overline">Worked example</p>
              <p className="small" style={{ margin: 0, color: 'var(--color-text-primary)' }}>
                {concept.worked_example}
              </p>
            </div>
          )}

          {concept.source_refs?.length > 0 && (
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Source: {concept.source_refs.join(', ')}
            </p>
          )}
        </section>
      ))}

      <div className="row between" style={{ marginTop: 'var(--space-8)' }}>
        {user ? (
          <button
            type="button"
            className={marked ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={markRead}
            disabled={marked}
          >
            {marked ? 'Marked as read' : 'Mark as read'}
          </button>
        ) : (
          <Link to="/sign-up" className="btn btn-secondary">
            Create an account to save your place
          </Link>
        )}

        {next ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/courses/${moduleId}/lessons/${next.ml}`)}
          >
            Next lesson: {next.title}
          </button>
        ) : (
          <Link to={`/courses/${moduleId}/quiz`} className="btn btn-primary">
            Take the quiz
          </Link>
        )}
      </div>
    </article>
  );
}
