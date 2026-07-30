import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { ModuleCard, Loading, ErrorNotice } from '../components/Bits.jsx';

const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];

export default function Catalogue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState('All levels');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .catalogue({ difficulty: level === 'All levels' ? undefined : level, q: search || undefined, limit: 50 })
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [level, search]);

  return (
    <div className="shell section">
      <p className="overline">Course catalogue</p>
      <h1>Ten courses, start anywhere</h1>
      <p style={{ maxWidth: 620 }}>
        Beginner courses assume nothing. Advanced courses assume you have finished the
        intermediate ones, but nothing is locked.
      </p>

      <div className="row" style={{ margin: 'var(--space-6) 0' }} role="search">
        <label className="visually-hidden" htmlFor="catalogue-search">
          Search courses
        </label>
        <input
          id="catalogue-search"
          className="input"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder="Search courses"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="row" role="group" aria-label="Filter by level">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              className={`btn ${level === option ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={level === option}
              onClick={() => setLevel(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <ErrorNotice error={error} onRetry={() => setLevel((l) => l)} />

      {!data && !error && <Loading what="courses" />}

      {data?.modules?.length === 0 && (
        <div className="notice">
          <p style={{ margin: 0 }}>
            No courses match that. Clear the search box or pick a different level to see everything.
          </p>
        </div>
      )}

      {data?.modules?.length > 0 && (
        <div className="grid grid-cards">
          {data.modules.map((module) => (
            <ModuleCard key={module.module_id} module={module} />
          ))}
        </div>
      )}
    </div>
  );
}
