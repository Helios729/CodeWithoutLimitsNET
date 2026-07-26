import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Loading } from './Bits.jsx';

/**
 * Route gate. This is a convenience for the learner, not a security control:
 * every protected resource is also enforced server-side, because anything
 * decided in the browser can be edited in the browser.
 */
export default function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading what="your account" />;
  if (!user) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  return children;
}
