import { useState } from 'react';
import translatorData from '../data/translators.json';

/**
 * Translations - one module per language pointing to verified open-source
 * translation resources, with a SeamlessM4T v2 speech fallback where supported.
 *
 * Each language card expands to show its recommended resources (name, provider,
 * licence, link) and whether speech-to-text is covered. The "gap is the
 * opportunity" note frames low-resource languages as buildable, saleable work -
 * verbatim from the original. Bundled data, works offline.
 */

const GAP_NOTE =
  'No open-source translator covers every language. That gap is also an opportunity: communities can build, label, and licence the missing corpora themselves and earn from it. Income Module 18 (\u2261 Module 2) shows one path \u2014 decoupled web-scraping & local market aggregation. Module 13 (Web Scraper) shows another. Helping low-resource languages reach quality parity is real, verifiable work \u2014 and the receipts (corpus, eval scores, translator API) are themselves saleable digital assets.';

export default function Translations() {
  const { title, subtitle, modules } = translatorData;
  const [openLang, setOpenLang] = useState(null);

  return (
    <div className="shell section" style={{ maxWidth: 820 }}>
      <p className="overline">Open-source translators</p>
      <h1>{title}</h1>
      <p style={{ maxWidth: 660 }}>{subtitle}</p>

      <div
        className="notice"
        style={{ borderColor: 'var(--color-brand-primary)', margin: 'var(--space-5) 0 var(--space-6)' }}
      >
        <p style={{ margin: 0, color: 'var(--color-brand-primary)', fontWeight: 600 }}>
          The gap is the opportunity
        </p>
        <p style={{ margin: 0 }} className="small">
          {GAP_NOTE}
        </p>
      </div>

      <p className="overline" style={{ marginBottom: 'var(--space-3)' }}>
        {modules.length} language modules
      </p>

      <div className="stack">
        {modules.map((mod) => {
          const lang = mod.language || {};
          const name = lang.name_en || 'Language';
          const speech = mod.speech_to_text?.covered_by_seamless_m4t_v2;
          const isOpen = openLang === name;

          return (
            <article key={name} className="card">
              <button
                type="button"
                onClick={() => setOpenLang(isOpen ? null : name)}
                aria-expanded={isOpen}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  width: '100%',
                  gap: 'var(--space-3)'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 var(--space-1)' }}>{name}</h3>
                  {lang.autonym && (
                    <p className="small" style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                      {lang.autonym}
                    </p>
                  )}
                  <div className="row" style={{ marginTop: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <span
                      className="small"
                      style={{
                        padding: '2px 10px',
                        borderRadius: '999px',
                        background: 'var(--color-background-primary)',
                        border: '1px solid var(--color-border-subtle)'
                      }}
                    >
                      {mod.recommended_resources?.length || 0} resources
                    </span>
                    <span
                      className="small"
                      style={{
                        padding: '2px 10px',
                        borderRadius: '999px',
                        background: speech ? 'var(--color-background-secondary)' : 'transparent',
                        border: `1px solid ${speech ? 'var(--color-success)' : 'var(--color-danger)'}`,
                        color: speech ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                    >
                      {speech ? 'speech \u2713' : 'speech: manual'}
                    </span>
                    {lang.regions?.slice(0, 2).map((r) => (
                      <span key={r} className="small" style={{ padding: '2px 6px', color: 'var(--color-text-secondary)' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <span aria-hidden="true" style={{ color: 'var(--color-brand-primary)', fontSize: '1.2rem' }}>
                  {isOpen ? '\u2212' : '+'}
                </span>
              </button>

              {isOpen && mod.recommended_resources?.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-4)' }}>
                  {mod.recommended_resources.map((r, i) => (
                    <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 500 }}>{r.name}</p>
                      <p className="small" style={{ margin: '0 0 2px', color: 'var(--color-text-secondary)' }}>
                        {[r.provider, r.venue, r.license].filter(Boolean).join(' · ')}
                      </p>
                      {r.notes && <p className="small" style={{ margin: '0 0 4px' }}>{r.notes}</p>}
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="small" style={{ wordBreak: 'break-all' }}>
                          {r.url}
                        </a>
                      )}
                    </div>
                  ))}
                  {mod.verified_on && (
                    <p className="small muted" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                      Verified on {mod.verified_on}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
