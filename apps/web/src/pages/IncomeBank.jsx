import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import incomeData from '../data/income-modules.json';

/**
 * Income & Asset Bank - the landing page listing all 18 monetisable modules.
 *
 * Each module is a locally-owned digital asset a participant learns to build and
 * sell. This page shows the numbered list with role label and short asset
 * description; tapping one opens its full detail page. Content is bundled at
 * build time so it works offline. Verbatim from the authored module bank.
 *
 * A light one-line note is shown before module 18 so learners know the repeat
 * is intentional — without explaining why. They discover what has changed, and
 * what they can now do with it, for themselves.
 */

export default function IncomeBank() {
  const { title, description, modules } = incomeData;

  return (
    <div className="shell section" style={{ maxWidth: 860 }}>
      <p className="overline">Income &amp; Asset Bank</p>
      <h1>{title}</h1>
      <p style={{ maxWidth: 660 }}>{description}</p>

      <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
        {modules.map((m) => (
          <Fragment key={m.id}>
            {m.id === 18 && (
              <p
                className="small"
                style={{
                  margin: 0,
                  padding: 'var(--space-3) var(--space-4)',
                  fontStyle: 'italic',
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-background-secondary)',
                  borderLeft: '3px solid var(--color-success)',
                  borderRadius: '8px'
                }}
              >
                By the way, this repetition is not a mistake. Notice what has changed.
              </p>
            )}
            <Link
              to={`/income/${m.slug || m.id}`}
              className="card"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: '999px',
                    background: 'var(--color-brand-primary)',
                    color: 'var(--color-on-brand)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  {m.id}
                </span>
                <div style={{ flex: 1 }}>
                  {m.role_label && (
                    <p className="overline" style={{ marginBottom: 'var(--space-1)' }}>
                      {m.role_label}
                    </p>
                  )}
                  <h3 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-text-primary)' }}>
                    {m.title}
                  </h3>
                  <p className="small" style={{ margin: 0 }}>
                    {m.asset}
                  </p>
                  {m.languages?.length > 0 && (
                    <div className="row" style={{ marginTop: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {m.languages.slice(0, 4).map((lang) => (
                        <span
                          key={lang}
                          className="small"
                          style={{
                            padding: '2px 10px',
                            borderRadius: '999px',
                            background: 'var(--color-background-primary)',
                            border: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          {lang}
                        </span>
                      ))}
                      {m.languages.length > 4 && (
                        <span className="small" style={{ padding: '2px 6px' }}>
                          +{m.languages.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
