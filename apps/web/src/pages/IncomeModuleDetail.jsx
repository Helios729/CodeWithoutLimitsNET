import { useParams, Link } from 'react-router-dom';
import incomeData from '../data/income-modules.json';

/**
 * Detail page for a single income/asset module.
 *
 * Shows every authored section - the asset you build, execution, energy
 * maximisation, why it monetises, community multiplier, the AI basics learned,
 * languages, and any ethical/safety rules and citations. Looked up by slug or
 * numeric id from the bundled data. Verbatim content.
 *
 * Repeat modules show a note above the Notes section: module 15 (expands
 * module 1) gets a short one-line nudge; module 18 (duplicates module 2) gets
 * the fuller explanation. Both let learners know the repeat is intentional.
 */

export default function IncomeModuleDetail() {
  const { moduleId } = useParams();
  const { modules } = incomeData;

  const module = modules.find(
    (m) => String(m.slug) === String(moduleId) || String(m.id) === String(moduleId)
  );

  if (!module) {
    return (
      <div className="shell section">
        <h1>Module not found</h1>
        <p>
          That income module doesn't exist. <Link to="/income">Back to the Income &amp; Asset Bank</Link>.
        </p>
      </div>
    );
  }

  const Section = ({ label, children }) =>
    children ? (
      <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <p className="overline" style={{ marginBottom: 'var(--space-2)' }}>
          {label}
        </p>
        <div>{children}</div>
      </section>
    ) : null;

  return (
    <article className="shell section" style={{ maxWidth: 820 }}>
      <Link to="/income" className="small" style={{ display: 'inline-block', marginBottom: 'var(--space-4)' }}>
        ← Income &amp; Asset Bank
      </Link>

      <p className="overline">
        Income Module {module.id}
        {module.role_label ? ` · ${module.role_label}` : ''}
      </p>
      <h1>{module.title}</h1>

      {/* The asset you build - highlighted as the anchor */}
      <div
        className="card"
        style={{
          background: 'var(--color-background-secondary)',
          borderColor: 'var(--color-success)',
          marginBottom: 'var(--space-5)'
        }}
      >
        <p className="overline" style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}>
          The asset you build
        </p>
        <p style={{ margin: 0 }}>{module.asset}</p>
      </div>

      <Section label="Execution">
        <p style={{ margin: 0 }}>{module.execution}</p>
      </Section>

      <Section label="Energy maximisation">
        <p style={{ margin: 0 }}>{module.energy_maximisation}</p>
      </Section>

      <Section label="Why it monetises">
        <p style={{ margin: 0 }}>{module.why_it_monetises}</p>
      </Section>

      <Section label="Community multiplier">
        <p style={{ margin: 0 }}>{module.community_multiplier}</p>
      </Section>

      {module.ai_basics_learned?.length > 0 && (
        <Section label="AI basics you'll learn">
          <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {module.ai_basics_learned.map((skill) => (
              <span
                key={skill}
                className="small"
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-brand-primary)',
                  color: 'var(--color-brand-primary)'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {module.languages?.length > 0 && (
        <Section label="Languages">
          <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {module.languages.map((lang) => (
              <span
                key={lang}
                className="small"
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </Section>
      )}

      {module.ethical_rule && (
        <Section label="Ethical rule">
          <p style={{ margin: 0 }}>{module.ethical_rule}</p>
        </Section>
      )}

      {module.safety_rule && (
        <Section label="Safety rule">
          <p style={{ margin: 0 }}>{module.safety_rule}</p>
        </Section>
      )}

      {module.id === 15 && (
        <p
          className="small"
          style={{
            margin: '0 0 var(--space-4)',
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

      {module.id === 18 && (
        <div
          className="card"
          style={{
            background: 'var(--color-background-secondary)',
            borderColor: 'var(--color-success)',
            marginBottom: 'var(--space-4)'
          }}
        >
          <p
            className="overline"
            style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}
          >
            Why is Task 18 the same as Task 2?
          </p>
          <p className="small" style={{ margin: 0 }}>
            You'll notice Task 18 repeats Task 2. That's intentional. Supporting and boosting
            local economies through community-based efforts is the spine of this programme —
            it earns its second seat at the table. Read both and notice how the framing shifts
            from the individual builder to the community multiplier.
          </p>
        </div>
      )}

      {module.notes && (
        <Section label="Notes">
          <p style={{ margin: 0 }}>{module.notes}</p>
        </Section>
      )}

      {module.citations?.length > 0 && (
        <Section label="Citations">
          <ul className="small stack" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {module.citations.map((c, i) => (
              <li key={i}>{typeof c === 'string' ? c : c.text || c.title || JSON.stringify(c)}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
