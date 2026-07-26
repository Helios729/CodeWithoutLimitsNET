import { Link } from 'react-router-dom';
import MountainRidge from '../components/MountainRidge.jsx';

export default function Home() {
  return (
    <>
      <section style={{ background: 'var(--color-background-primary)', overflow: 'hidden' }}>
        <div className="shell" style={{ paddingTop: 'var(--space-9)', paddingBottom: 'var(--space-7)' }}>
          <div style={{ maxWidth: 660 }}>
            <p className="overline">Mondial Connections · Community Changers</p>
            <h1 style={{ marginBottom: 'var(--space-5)' }}>
              Learn the tools that let you build what your community needs.
            </h1>
            <p style={{ fontSize: 'var(--type-body-lg)' }}>
              Ten courses in artificial intelligence, programming and the web. Every explanation is
              tied to a named source you can open for free. Everything works on a slow connection
              and a modest phone.
            </p>
            <div className="row" style={{ marginTop: 'var(--space-6)' }}>
              <Link to="/courses" className="btn btn-primary">
                Browse the courses
              </Link>
              <Link to="/sign-up" className="btn btn-secondary">
                Create a free account
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-4)' }}>
              You can read the first lesson of any course without an account.
            </p>
          </div>
        </div>
        <MountainRidge height={280} />
      </section>

      <section className="shell section">
        <div className="grid grid-cards">
          <article className="card">
            <p className="overline">How it works</p>
            <h3>Read, then prove it</h3>
            <p className="small">
              Each course is four short lessons, each paired with a five-question check. Questions
              are written across three levels: recall, understanding, and applying the idea to a
              situation you have not seen before.
            </p>
          </article>
          <article className="card">
            <p className="overline">How it works</p>
            <h3>Sources you can open</h3>
            <p className="small">
              Explanations cite MIT OpenCourseWare, Stanford course notes, the original papers and
              MDN. Nothing sits behind a paywall. If we say something, you can go and check it.
            </p>
          </article>
          <article className="card">
            <p className="overline">How it works</p>
            <h3>Learn together</h3>
            <p className="small">
              Join with a cohort code and your facilitator sees where the group is losing marks,
              level by level, without ever seeing your individual answers.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
