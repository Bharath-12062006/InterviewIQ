import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <p className="font-display text-6xl font-semibold text-signal">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-1 text-ink-soft">Check the address, or head back to your dashboard.</p>
      <Link to="/dashboard" className="btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
}
