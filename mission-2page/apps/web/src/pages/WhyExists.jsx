import { useNavigate } from 'react-router-dom';

/**
 * Page 2 of the two-page welcome flow: "Why Code Without Limits exists".
 *
 * This is the fuller explanation - the pilot note, the token/voice-mode
 * guidance, the water-usage passage, "Knowledge matters", and the citation.
 * It ends in "I understand - let's begin", which is the point at which the
 * visitor is marked as having completed the welcome.
 *
 * After this button is tapped once, returning visitors skip both welcome pages
 * and land on the courses; both pages remain reachable any time from the
 * "Mission" link in the navigation. Remembered per browser via localStorage,
 * no account required.
 *
 * Copy is verbatim from the original app's welcome screen.
 */

const SEEN_KEY = 'cwl.welcome.acknowledged';

export default function WhyExists() {
  const navigate = useNavigate();

  const begin = () => {
    try {
      localStorage.setItem(SEEN_KEY, 'true');
    } catch {
      /* proceed regardless of storage availability */
    }
    navigate('/courses');
  };

  return (
    <article className="shell section" style={{ maxWidth: 860 }}>
      <p className="overline">Before you begin</p>
      <h1>Why Code Without Limits exists</h1>

      <div
        className="notice"
        style={{ borderColor: 'var(--color-brand-primary)', marginBottom: 'var(--space-6)' }}
      >
        <p style={{ margin: 0, color: 'var(--color-brand-primary)', fontWeight: 600 }}>
          This is a pilot app.
        </p>
        <p style={{ margin: 0 }}>
          Like the communities it serves, Community Changers conducts continuous self-checks —
          surveys, user feedback, and internal review — to catch broken links, omissions, and
          errors. Your feedback is welcome at every turn. Tap the survey button at the end of any
          module, and flag anything that looks off.
        </p>
      </div>

      <p>
        The core mission for creating this app is to mitigate the digital, and now AI, divide. AI
        was used as a co-creator for this app — specifically, <strong>Perplexity</strong> to verify
        research, and both <strong>Claude 4.6</strong> and <strong>ChatGPT 5.4</strong> to verify,
        and at times write or edit, code.
      </p>

      <p>
        The lessons are presented in a format that eventually leads users to understand that coding
        through AI <strong>without</strong> knowing anything about basic elements of computer
        science / computer engineering is <strong>costly</strong> and potentially{' '}
        <strong>hazardous</strong>.
      </p>

      <p>
        It would be unethical for users to think they can build complex systems in an hour or less.
        All users must understand concepts such as <strong>bandwidth</strong>,{' '}
        <strong>throughput</strong>, <strong>bottlenecks</strong>, <strong>timeouts</strong>,{' '}
        <strong>resets</strong>, and <strong>memory</strong> to use the available AI tools
        effectively and efficiently — in terms of both time and cost.
      </p>

      <p>
        Consequently, the sequence starts with an <strong>Introduction to AI</strong> and ends with{' '}
        <strong>Advanced HTML and API formation</strong> so students can comprehend that the
        foundation greatly matters — despite how much fun coding without foundational knowledge of
        coding might seem.
      </p>

      <p>
        Note that the modules are presented as teasers. Terms with which you are not familiar are
        used. This is to encourage you to use the reading materials and learn the concepts well. You
        can copy the link of the YouTube channels and place those links in certain text boxes that
        will provide you with a transcript or summary. Most of your time on the app will be spent
        learning and then planning. You will need to be efficient in writing your prompts. Do not
        fall into the trap of using voice mode. With voice mode, you are using up more tokens than
        if you write — unless you are a very efficient speaker.
      </p>

      <p>
        Also be mindful of prompting since published estimates suggest that one U.S. gallon of water
        could correspond anywhere from a few hundred generated words in high-cost GPT-4-style
        conditions to tens of thousands of short prompt words in ordinary chatbot use. Shumba et al.
        (2024) modeled water-use efficiency for data centers across 41 African countries and
        estimated GPT-4 water consumption for selected AI tasks in 11 representative African
        countries. The higher the model and the lengthier the prompt, the more water is needed to
        cool the machines at the centers.
      </p>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          color: 'var(--color-brand-primary)',
          textAlign: 'center',
          fontSize: 'var(--type-h4)',
          margin: 'var(--space-7) 0 var(--space-5)'
        }}
      >
        Knowledge matters.
      </p>

      <p>
        The reading lists will continuously be populated along with the links to the open courses
        and channels on social media. If funds or grants from private, corporate, or other donors
        permit, users can seek certification by remitting the requisite fees on the open-course
        platforms with which we have no affiliation.
      </p>

      <div
        className="card"
        style={{ background: 'var(--color-background-secondary)', borderColor: 'var(--color-success)' }}
      >
        <p className="small" style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
          Shumba, N., Tshekiso, O., Li, P., Fanti, G., &amp; Ren, S. (2024). A water efficiency
          dataset for African data centers. arXiv. https://arxiv.org/abs/2412.03716
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 'var(--space-6)', minHeight: 52, fontSize: '1.05rem' }}
        onClick={begin}
      >
        I understand — let's begin
      </button>
    </article>
  );
}
