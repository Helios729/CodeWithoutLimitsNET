import { useState, useMemo } from 'react';
import glossaryData from '../data/glossary.json';

/**
 * Mini dictionary / glossary.
 *
 * Every term the modules use as a "teaser" is defined here, with a plain-language
 * short form, a fuller definition, worked examples, and a cited source - so a
 * learner who meets an unfamiliar word has somewhere concrete to go.
 *
 * Bundled at build time and filtered client-side, so search is instant and works
 * offline. Content is verbatim from the authored glossary file.
 */

export default function Glossary() {
  const { title, description, verified_on, terms } = glossaryData;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.short?.toLowerCase().includes(q) ||
        t.definition?.toLowerCase().includes(q)
    );
  }, [query, terms]);

  return (
    <div className="shell section" style={{ maxWidth: 780 }}>
      <p className="overline">Words to know · cited sources</p>
      <h1>{title}</h1>
      <p style={{ maxWidth: 620 }}>{description}</p>

      <div style={{ margin: 'var(--space-6) 0' }} role="search">
        <label className="visually-hidden" htmlFor="glossary-search">
          Search the glossary
        </label>
        <input
          id="glossary-search"
          className="input"
          style={{ maxWidth: 360 }}
          type="search"
          placeholder="Search terms"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="notice">
          <p style={{ margin: 0 }}>No term matches "{query}". Try a shorter or different word.</p>
        </div>
      ) : (
        <div className="stack">
          {filtered.map((term) => (
            <article key={term.term} className="card">
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{term.term}</h3>
              {term.short && (
                <p style={{ margin: '0 0 var(--space-3)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {term.short}
                </p>
              )}
              {term.definition && <p className="small">{term.definition}</p>}

              {term.examples?.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <p className="overline" style={{ marginBottom: 'var(--space-2)' }}>
                    Examples
                  </p>
                  <ul className="small stack" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {term.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {term.source?.url && (
                <p className="small muted" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
                  Source:{' '}
                  <a href={term.source.url} target="_blank" rel="noopener noreferrer">
                    {term.source.title || term.source.url}
                  </a>
                  {term.source.publisher ? ` — ${term.source.publisher}` : ''}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {verified_on && (
        <p className="small muted" style={{ textAlign: 'right', marginTop: 'var(--space-6)' }}>
          Verified on {verified_on}
        </p>
      )}
    </div>
  );
}
