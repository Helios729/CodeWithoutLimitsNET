import { useNavigate } from 'react-router-dom';

/**
 * Page 1 of the two-page welcome flow: "Our core mission".
 *
 * This is the shorter, mission-framing screen. It ends in a "Continue" button
 * that leads to page 2 ("Why Code Without Limits exists"). Splitting the
 * welcome across two deliberate screens is intentional: each tap is a small
 * moment of commitment that reinforces the seriousness and the format, and two
 * shorter screens render more kindly on a modest phone than one long one.
 *
 * Copy is verbatim from the original app's core-mission screen.
 */

export default function CoreMission() {
  const navigate = useNavigate();

  return (
    <article className="shell section" style={{ maxWidth: 820 }}>
      <div
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          borderRadius: '999px',
          border: '1.5px solid var(--color-brand-primary)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 'var(--space-4)'
        }}
      >
        {/* Compass glyph, echoing the original */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" />
          <path d="M15.5 8.5 11 11l-2.5 4.5L13 13l2.5-4.5Z" fill="var(--color-brand-primary)" />
        </svg>
      </div>

      <p className="overline">Our core mission</p>
      <h1>Mitigate the digital — and now the AI — divide.</h1>

      <p>
        The core mission for creating this app is to mitigate the digital, and now AI, divide. AI
        was used as a co-creator for this app — specifically, <strong>Perplexity</strong> to verify
        research, and both <strong>Claude 4.6</strong> and <strong>ChatGPT 5.4</strong> to verify,
        and at times, write or edit, code. The lessons are presented in a format that eventually
        leads users to understand that coding through AI without knowing anything about basic
        elements of computer science / computer engineering is costly and potentially hazardous.
      </p>

      

      <p>
       Additional Reading Lists will eventually be provided along with more links to free open
        courses where users may further their knowledge. If funds or grants permit on their end or
        ours, they can seek certification by paying the requisite fees on those platforms with which
        we have no affiliation.
      </p>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 'var(--space-6)', minHeight: 52, fontSize: '1.05rem' }}
        onClick={() => navigate('/welcome/why')}
      >
        Continue →
      </button>
    </article>
  );
}
