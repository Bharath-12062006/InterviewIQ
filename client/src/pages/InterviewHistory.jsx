import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Calendar, Clock,
  Download, Mic, Trash2,
} from 'lucide-react';
import { getInterviews, saveInterviews } from '../data/mock';
import { api } from '../lib/api';
import ScorePill from '../components/ui/ScorePill';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../lib/score';

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState(getInterviews());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');

  useEffect(() => {
    let active = true;
    async function loadInterviews() {
      try {
        const remote = await api.get('/interviews');
        if (active && Array.isArray(remote)) {
          setInterviews(remote);
          saveInterviews(remote);
        }
      } catch (err) {
        console.info('Interviews DB sync notice:', err.message);
      }
    }
    loadInterviews();
    return () => {
      active = false;
    };
  }, []);

  const categories = ['All', ...new Set(interviews.map((i) => i.category))];
  const modes = ['All', ...new Set(interviews.map((i) => i.mode))];

  const filtered = interviews.filter((iv) => {
    const matchesSearch = iv.category.toLowerCase().includes(search.toLowerCase()) ||
      iv.mode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || iv.category === selectedCategory;
    const matchesMode = selectedMode === 'All' || iv.mode === selectedMode;
    return matchesSearch && matchesCategory && matchesMode;
  });

  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((a, b) => a + b.score, 0) / interviews.length)
    : 0;

  const totalMinutes = interviews.reduce((a, b) => a + (b.minutes || 25), 0);
  const bestScore = interviews.length > 0
    ? Math.max(...interviews.map((i) => i.score))
    : 0;

  const handleDelete = async (id) => {
    if (window.confirm('Delete this interview record?')) {
      const updated = interviews.filter((i) => i.id !== id);
      setInterviews(updated);
      saveInterviews(updated);
      try {
        await api.delete(`/interviews/${encodeURIComponent(id)}`);
      } catch (err) {
        console.info('Delete interview DB notice:', err.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Category,Mode,Difficulty,Date,Minutes,Score\n';
    const rows = interviews.map((i) => `${i.id},${i.category},${i.mode},${i.difficulty},${i.date},${i.minutes},${i.score}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviewiq-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Interview History & Records
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Review past mock interview sessions, monitor performance trends, and inspect full answer transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-outline inline-flex items-center gap-1.5 text-xs"
          >
            <Download size={14} /> Export CSV
          </button>
          <Link to="/interview" className="btn-primary inline-flex items-center gap-1.5 text-xs">
            <Mic size={14} /> Start New Interview
          </Link>
        </div>
      </div>

      {/* Top Stat Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-surface p-4 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Completed</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{interviews.length}</p>
          <p className="text-[11px] text-ink-soft">Recorded sessions</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Average Score</p>
          <p className="mt-1 font-display text-2xl font-bold text-signal">{avgScore}%</p>
          <p className="text-[11px] text-jade font-semibold">+6% vs last month</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Best Score</p>
          <p className="mt-1 font-display text-2xl font-bold text-jade">{bestScore}%</p>
          <p className="text-[11px] text-ink-soft">Personal record</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Time Invested</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{(totalMinutes / 60).toFixed(1)} hrs</p>
          <p className="text-[11px] text-ink-soft">{totalMinutes} total minutes</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-panel md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-ink-faint" />
          <input
            type="text"
            placeholder="Search category or interviewer mode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Filter size={14} /> Category:
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            Mode:
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink"
            >
              {modes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List of Interviews */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No interview records found"
          body="Try adjusting your filters or launch a new mock interview session."
          actionLabel="Start an Interview"
          actionTo="/interview"
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface shadow-panel">
          <div className="hidden border-b border-line bg-paper/60 px-6 py-3 text-xs font-bold text-ink-faint md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_5rem_7rem]">
            <span>Category & Topic</span>
            <span>Interviewer & Level</span>
            <span>Date</span>
            <span>Duration</span>
            <span>Score</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-line">
            {filtered.map((iv) => (
              <li
                key={iv.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 hover:bg-paper/30 transition-colors md:grid-cols-[2fr_1.5fr_1fr_1fr_5rem_7rem]"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-ink">{iv.category}</p>
                  <p className="text-xs text-ink-soft">Report: <span className="font-mono">{iv.id}</span></p>
                </div>

                <div className="hidden text-xs text-ink-soft md:block">
                  <span className="font-semibold text-ink">{iv.mode}</span>
                  <p className="text-[11px] text-ink-faint">{iv.difficulty}</p>
                </div>

                <div className="hidden text-xs text-ink-soft md:flex items-center gap-1">
                  <Calendar size={13} className="text-ink-faint" />
                  <span>{formatDate(iv.date)}</span>
                </div>

                <div className="hidden text-xs text-ink-soft md:flex items-center gap-1">
                  <Clock size={13} className="text-ink-faint" />
                  <span>{iv.minutes} min</span>
                </div>

                <div>
                  <ScorePill score={iv.score} />
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1">
                  <Link
                    to={`/report/${iv.id}`}
                    className="btn-outline px-2.5 py-1 text-xs"
                    title="View Detailed Evaluation Report"
                  >
                    View Report
                  </Link>
                  <button
                    onClick={() => handleDelete(iv.id)}
                    className="rounded p-1 text-ink-faint hover:text-rose"
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
