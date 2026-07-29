import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Field, ErrorNotice } from '../components/Bits.jsx';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', cohort: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signUp({ ...form, cohort: form.cohort || undefined });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell section" style={{ maxWidth: 440 }}>
      <p className="overline">Free, and it stays free</p>
      <h1>Create your account</h1>

      <form onSubmit={onSubmit} noValidate>
        <ErrorNotice error={error} />
        <Field
          id="displayName"
          label="What should we call you?"
          name="displayName"
          autoComplete="name"
          required
          value={form.displayName}
          onChange={update('displayName')}
        />
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
          autoComplete="new-password"
          required
          hint="At least 12 characters. A short phrase you will remember works better than a complicated word."
          value={form.password}
          onChange={update('password')}
        />
        <Field
          id="cohort"
          label="Cohort code (optional)"
          name="cohort"
          hint="If a facilitator gave you a code, enter it so your group results roll up together."
          value={form.cohort}
          onChange={update('cohort')}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 'var(--space-5)' }}>
        Already registered? <Link to="/sign-in">Sign in</Link>.
      </p>
    </div>
  );
}
