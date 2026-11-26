import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, School, Briefcase, Eye, EyeOff, 
  ArrowRight, CheckCircle, AlertCircle, RefreshCw, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agree) {
      setError('Please accept the placement honor code.');
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        name,
        email,
        password,
        targetRole,
        university,
      });

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Failed to create account.');
      }
    } catch (err) {
      setError('An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Left Column: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
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
              Create your student profile
            </h1>
            <p className="mt-1 text-xs text-ink-soft">
              Join thousands of campus graduates preparing for top tech companies.
            </p>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-soft px-3.5 py-2.5 text-xs font-semibold text-rose">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-ink-soft">Full Name</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                />
                <User size={15} className="absolute left-3 top-2.5 text-ink-faint" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft">College / University Email</label>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">University / Institute</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anna Univ, CEG"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                  />
                  <School size={14} className="absolute left-2.5 top-2.5 text-ink-faint" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft">Target Job Role</label>
                <div className="relative mt-1">
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-signal"
                  >
                    <option value="Software Engineer">Software Engineer (SDE)</option>
                    <option value="Frontend Engineer">Frontend Engineer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Data Engineer">Data Engineer</option>
                  </select>
                  <Briefcase size={14} className="absolute left-2.5 top-2.5 text-ink-faint" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                  />
                  <Lock size={14} className="absolute left-2.5 top-2.5 text-ink-faint" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-signal"
                  />
                  <Lock size={14} className="absolute left-2.5 top-2.5 text-ink-faint" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="honorCode"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-line text-signal focus:ring-signal"
              />
              <label htmlFor="honorCode" className="text-[11px] text-ink-soft cursor-pointer">
                I agree to the campus preparation guidelines and honor code.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs shadow-md transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Creating Profile...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Create Account & Enter Platform <ArrowRight size={14} />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-soft">
            Already registered on InterviewIQ?{' '}
            <Link to="/login" className="font-bold text-signal hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column Banner */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex flex-col justify-between bg-navy-900 p-12 text-white">
          <div className="flex items-center gap-2 text-signal-soft">
            <Sparkles size={18} />
            <span className="font-display text-sm font-bold uppercase tracking-wider">Placement Acceleration</span>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              Start with an accurate diagnostic score.
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Your free student account gives you access to full mock interviews, customized study plans, ATS resume checks, and coding test sandboxes.
            </p>

            <div className="rounded-xl bg-navy-800 p-4 border border-white/10 space-y-2">
              <p className="font-bold text-xs text-white">What happens next?</p>
              <ol className="list-decimal pl-4 text-xs text-white/70 space-y-1">
                <li>Your profile is created and personalized for {targetRole}.</li>
                <li>Take a quick 10-minute diagnostic interview in DSA or HR.</li>
                <li>Review your scored rubric and 7-day adaptive roadmap.</li>
              </ol>
            </div>
          </div>

          <div className="text-xs text-white/40">
            © 2026 InterviewIQ Platform. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
