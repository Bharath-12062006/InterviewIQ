import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle, AlertCircle, RefreshCw, ShieldCheck, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoNotice('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Left Column: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo & Theme Toggle */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-signal font-display text-base font-bold text-white shadow-md">
                IQ
              </span>
              <span className="font-display text-2xl font-bold tracking-tight text-ink">
                Interview<span className="text-signal">IQ</span>
              </span>
            </div>
            <ThemeToggle showLabel />
          </div>

          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="mt-1.5 text-xs text-ink-soft">
              Log in with your registered account to access mock interviews and practice sessions.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-soft px-3.5 py-2.5 text-xs font-semibold text-rose">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoNotice && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-signal/30 bg-signal-soft px-3.5 py-2.5 text-xs font-semibold text-signal-deep">
              <Info size={15} className="shrink-0" />
              <span>{infoNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft">College / Personal Email</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                />
                <Mail size={15} className="absolute left-3 top-2.5 text-ink-faint" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink-soft">Password</label>
                <button
                  type="button"
                  onClick={() =>
                    setInfoNotice('Use your registered email and password, or create a new student account below.')
                  }
                  className="text-[11px] font-semibold text-signal hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-10 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                />
                <Lock size={15} className="absolute left-3 top-2.5 text-ink-faint" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-ink-faint hover:text-ink"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line text-signal focus:ring-signal"
                />
                <span className="text-xs text-ink-soft">Remember this session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs shadow-md transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Sign In <ArrowRight size={14} />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Don't have an InterviewIQ account?{' '}
            <Link to="/signup" className="font-bold text-signal hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Banner for Campus Placements */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex flex-col justify-between bg-navy-900 p-12 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur">
              <ShieldCheck size={14} className="text-jade" /> Official Placement Preparation Suite
            </div>
            <span className="text-xs text-white/50">Phase 1 · Campus Edition</span>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              Master your technical & HR rounds with personalized AI.
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Simulate realistic interviews, get detailed rubric feedback on every answer, and bridge skill gaps for your dream tech companies.
            </p>

            <div className="space-y-3 pt-4 text-xs">
              <div className="flex items-center gap-2.5 text-white/90">
                <CheckCircle size={16} className="text-jade" />
                <span>18 Technical categories across DSA, DBMS, System Design & HR</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/90">
                <CheckCircle size={16} className="text-jade" />
                <span>Interactive speech-to-text live room with adaptive follow-ups</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/90">
                <CheckCircle size={16} className="text-jade" />
                <span>Instant ATS resume evaluation & code sandbox test runner</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-navy-800/80 p-4 border border-white/10 backdrop-blur">
            <p className="font-display text-xs font-bold text-white">
              “Structured daily practice and rubric-based feedback make technical interviews predictable and calm.”
            </p>
            <p className="mt-1 text-[11px] text-white/50">InterviewIQ Campus Placement Readiness Framework</p>
          </div>
        </div>
      </div>
    </div>
  );
}
