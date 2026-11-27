import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Filter,
  Loader2,
  Play,
  Search,
  Trash2,
} from 'lucide-react';
import Panel from '../components/ui/Panel';
import ScorePill from '../components/ui/ScorePill';
import { api } from '../lib/api';

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');

  useEffect(() => {
    let active = true;
    async function loadInterviews() {
      setLoading(true);
      setError('');
      try {
        const remote = await api.get('/interview/history');
        if (active) {
          setInterviews(Array.isArray(remote) ? remote : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load interview history.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInterviews();
    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id) {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/interview/${encodeURIComponent(id)}`);
      setInterviews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete interview record.');
    } finally {
      setDeletingId('');
    }
  }

  const categories = useMemo(
    () => ['All', ...new Set(interviews.map((i) => i.category).filter(Boolean))],
    [interviews]
  );

  const modes = useMemo(
    () => ['All', ...new Set(interviews.map((i) => i.mode).filter(Boolean))],
    [interviews]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return interviews.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedMode !== 'All' && item.mode !== selectedMode) return false;
      if (!q) return true;
      return (
        String(item.category || '').toLowerCase().includes(q) ||
        String(item.jobRole || '').toLowerCase().includes(q) ||
        String(item.mode || '').toLowerCase().includes(q) ||
        String(item.summary || '').toLowerCase().includes(q)
      );
    });
  }, [interviews, search, selectedCategory, selectedMode]);

  const stats = useMemo(() => {
    const count = interviews.length;
    if (count === 0) {
      return { count: 0, avgScore: 0, totalMinutes: 0, highestScore: 0 };
    }
    const scores = interviews.map((i) => Number(i.score || 0));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / count);
    const highestScore = Math.max(...scores);
    const totalMinutes = interviews.reduce(
      (sum, i) => sum + Number(i.minutes || Math.round((i.elapsedSeconds || 60) / 60)),
      0
    );
    return { count, avgScore, totalMinutes, highestScore };
  }, [interviews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Interview History</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Review past AI mock interviews, scores, missing concepts, and detailed question feedback.
          </p>
        </div>
        <Link
          to="/interview"
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-signal"
        >
          <Play className="h-4 w-4" />
          New Interview
        </Link>
      </div>

      {/* Real Computed Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-4">
          <p className="text-xs font-medium text-ink-soft">Completed Sessions</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{stats.count}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium text-ink-soft">Average Score</p>
          <p className="mt-1 font-display text-2xl font-bold text-signal">{stats.avgScore}%</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium text-ink-soft">Best Performance</p>
          <p className="mt-1 font-display text-2xl font-bold text-jade">{stats.highestScore}%</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium text-ink-soft">Practice Time</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{stats.totalMinutes}m</p>
        </Panel>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <Panel className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, topic, or summary..."
              className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-mute focus:border-signal focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink focus:border-signal focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none"
          >
            {modes.map((m) => (
              <option key={m} value={m}>
                Style: {m}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {/* Records List */}
      {loading ? (
        <Panel className="p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-signal" />
          <p className="mt-3 text-sm text-ink-soft">Loading your saved interview sessions...</p>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="font-display text-base font-semibold text-ink">
            {interviews.length === 0 ? 'No completed mock interviews yet' : 'No sessions match these filters'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {interviews.length === 0
              ? 'Start an AI mock interview session to receive live adaptive questions and an evaluation report.'
              : 'Try adjusting your search query or filters.'}
          </p>
          {interviews.length === 0 && (
            <Link
              to="/interview"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white dark:bg-signal"
            >
              <Play className="h-4 w-4" />
              Configure First Interview
            </Link>
          )}
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Panel key={item.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-ink">
                      {item.jobRole ? `${item.jobRole} — ${item.category}` : item.category}
                    </h2>
                    <ScorePill score={item.score ?? 0} />
                    {item.performanceLevel && (
                      <span className="rounded-full bg-signal/10 px-2.5 py-0.5 text-[11px] font-semibold text-signal">
                        {item.performanceLevel}
                      </span>
                    )}
                    {item.resumeFileName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-jade/10 px-2 py-0.5 text-[11px] font-medium text-jade">
                        <FileText className="h-3 w-3" />
                        {item.resumeFileName}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
                    <span>{item.mode}</span>
                    <span>· {item.difficulty}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {item.minutes || Math.max(1, Math.round((item.elapsedSeconds || 60) / 60))}m
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                    </span>
                    <span>· {item.questions?.length || 0} Qs</span>
                  </div>

                  {item.summary && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{item.summary}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/interview/report/${encodeURIComponent(item.id)}`}
                    className="rounded-lg border border-line bg-paper px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface"
                  >
                    View Report
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-lg border border-line bg-paper p-2 text-ink-mute hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-50"
                    title="Delete interview record"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
