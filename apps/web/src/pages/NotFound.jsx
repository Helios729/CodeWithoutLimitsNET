import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="shell section" style={{ maxWidth: 520 }}>
      <p className="overline">404</p>
      <h1>That page is not here</h1>
      <p>
        The link may be out of date, or the course may have been renamed. The catalogue lists
        everything that is published.
      </p>
      <Link to="/courses" className="btn btn-primary">
        Browse the courses
      </Link>
    </div>
  );
}
