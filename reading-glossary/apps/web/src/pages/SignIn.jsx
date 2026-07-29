import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Field, ErrorNotice } from '../components/Bits.jsx';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell section" style={{ maxWidth: 440 }}>
      <p className="overline">Welcome back</p>
      <h1>Sign in</h1>

      <form onSubmit={onSubmit} noValidate>
        <ErrorNotice error={error} />
        <Field
          id="email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 'var(--space-5)' }}>
        No account yet? <Link to="/sign-up">Create one free</Link>.
      </p>
    </div>
  );
}
