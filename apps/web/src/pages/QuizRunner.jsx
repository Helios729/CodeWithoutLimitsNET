import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Loading, ErrorNotice, ProgressMeter } from '../components/Bits.jsx';

/**
 * Runs one attempt.
 *
 * Note what is not here: no answer key, no client-side scoring, no "reveal"
 * branch. The component holds a map of question id to chosen letter and posts
 * it. Correctness arrives from the server only after submission, which is the
 * only arrangement where a learner cannot read the answers out of the page.
 */
export default function QuizRunner() {
  const { moduleId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    api
      .startAttempt(moduleId, { scope: 'module' })
      .then((data) => {
        if (cancelled) return;
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setStartedAt(Date.now());
      })
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const current = questions[index];

  const choose = (qId, letter) => {
    setChoices((prev) => ({
      ...prev,
      [qId]: { selected: letter, timeOnTaskMs: Date.now() - startedAt }
    }));
  };

  const goNext = () => {
    setStartedAt(Date.now());
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses = Object.entries(choices).map(([q_id, value]) => ({
        q_id,
        selected: value.selected,
        timeOnTaskMs: value.timeOnTaskMs
      }));
      setResult(await api.submitAttempt(attempt.id, responses));
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !attempt) return <div className="shell section"><ErrorNotice error={error} /></div>;
  if (!attempt) return <Loading what="your quiz" />;

  if (result) return <Results moduleId={moduleId} result={result} />;

  const answered = Object.keys(choices).length;

  return (
    <div className="shell section" style={{ maxWidth: 740 }}>
      <p className="overline">
        Question {index + 1} of {questions.length} · {current.bloom} {current.skill}
      </p>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <ProgressMeter value={answered} max={questions.length} label={`${answered} answered`} />
      </div>

      <h1 style={{ fontSize: 'var(--type-h3)' }}>{current.stem}</h1>

      <div role="group" aria-label="Answer options" style={{ marginTop: 'var(--space-5)' }}>
        {Object.entries(current.options).map(([letter, text]) => {
          const selected = choices[current.q_id]?.selected === letter;
          return (
            <button
              key={letter}
              type="button"
              className="option"
              aria-pressed={selected}
              onClick={() => choose(current.q_id, letter)}
            >
              <span className="option-key" aria-hidden="true">
                {letter}
              </span>
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      <ErrorNotice error={error} />

      <div className="between" style={{ marginTop: 'var(--space-6)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Back
        </button>

        {index < questions.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Next question
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={submitting || answered === 0}
          >
            {submitting ? 'Sending…' : `Submit ${answered} of ${questions.length}`}
          </button>
        )}
      </div>

      {index === questions.length - 1 && answered < questions.length && (
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
          Unanswered questions are marked wrong. You have {questions.length - answered} left.
        </p>
      )}
    </div>
  );
}

function Results({ moduleId, result }) {
  const { result: score, feedback } = result;

  return (
    <div className="shell section" style={{ maxWidth: 760 }}>
      <p className="overline">Quiz result</p>
      <h1>
        {score.score} out of {score.total} — {score.percentage}%
      </h1>
      <p>
        <span className={score.passed ? 'badge badge-success' : 'badge badge-danger'}>
          {score.passed ? 'Passed' : 'Not yet'}
        </span>{' '}
        <span className="muted small">Pass mark is {score.passThresholdPct}%.</span>
      </p>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <p className="overline">By level</p>
        {Object.entries(score.bloomBreakdown).map(([level, counts]) => (
          <div key={level} style={{ marginBottom: 'var(--space-4)' }}>
            <ProgressMeter
              value={counts.correct}
              max={counts.total}
              label={`${level} — ${counts.correct} of ${counts.total}`}
            />
          </div>
        ))}
      </div>

      <h2>Review</h2>
      {feedback.map((item) => (
        <article
          key={item.q_id}
          className={`card ${item.correct ? 'option-correct' : 'option-incorrect'}`}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <p className={`overline ${item.correct ? 'option-verdict-correct' : 'option-verdict-incorrect'}`}>
            {item.correct ? 'Correct' : 'Incorrect'} · {item.bloom}
          </p>
          <h4>{item.stem}</h4>
          <p className="small">
            <strong>You chose {item.selected}:</strong> {item.selectedText}
          </p>
          {!item.correct && (
            <p className="small">
              <strong>Correct answer {item.correctOption}:</strong> {item.correctText}
            </p>
          )}
          <p className="small muted">{item.explanation}</p>
          {item.source && <p className="small muted">Source: {item.source}</p>}
        </article>
      ))}

      <div className="row" style={{ marginTop: 'var(--space-6)' }}>
        <Link to={`/courses/${moduleId}`} className="btn btn-secondary">
          Back to the course
        </Link>
        <Link to="/dashboard" className="btn btn-primary">
          See my learning
        </Link>
      </div>
    </div>
  );
}
