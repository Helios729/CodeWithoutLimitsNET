

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

function Nav() {
  const { user, signOut } = useAuth();

  return (
    <header
      style={{
        background: 'var(--color-background-secondary)',
        borderBottom: '1px solid var(--color-border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}
    >
      <div className="shell between" style={{ minHeight: 68 }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1.15rem',
            color: 'var(--color-brand-primary)',
            textDecoration: 'none',
            letterSpacing: 'var(--tracking-display)'
          }}
        >
          Code Without Limits
        </Link>

        <nav className="row" aria-label="Main">
          <NavLink to="/welcome" className="btn btn-quiet">
            Mission
          </NavLink>
          <NavLink to="/courses" className="btn btn-quiet">
            Courses
          </NavLink>
          <NavLink to="/reading-list" className="btn btn-quiet">
            Reading list
          </NavLink>
          <NavLink to="/glossary" className="btn btn-quiet">
            Glossary
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className="btn btn-quiet">
                My learning
              </NavLink>
              <button type="button" className="btn btn-secondary" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/sign-in" className="btn btn-quiet">
                Sign in
              </NavLink>
              <NavLink to="/sign-up" className="btn btn-primary">
                Create free account
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-text-primary)',
        color: 'var(--color-background-primary)',
        marginTop: 'var(--space-9)'
      }}
    >
      <div className="shell" style={{ padding: 'var(--space-7) var(--space-5)' }}>
        <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 420 }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--color-background-primary)',
                marginBottom: 'var(--space-2)'
              }}
            >
              Code Without Limits
            </p>
            <p style={{ color: 'var(--color-accent-warm)', fontSize: 'var(--type-caption)' }}>
              Courses built for learners on modest devices and slow connections. Every claim is
              tied to a named, freely reachable source.
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--color-accent-warm)', fontSize: 'var(--type-caption)' }}>
              A programme of Mondial Connections and Community Changers.
            </p>
            <p style={{ color: 'var(--color-accent-warm)', fontSize: 'var(--type-caption)' }}>
              codewithoutlimits.net
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}




