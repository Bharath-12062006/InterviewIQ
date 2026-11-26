import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Sparkles,
  Clock, Calendar, Printer, RotateCcw,
} from 'lucide-react';
import { getInterviewById } from '../data/mock';
import { api } from '../lib/api';
import ScorePill from '../components/ui/ScorePill';
import Panel from '../components/ui/Panel';

export default function InterviewReport() {
  const { id } = useParams();
  const [report, setReport] = useState(() => getInterviewById(id));

  useEffect(() => {
    let active = true;
    async function loadReport() {
      try {
        const remote = await api.get(`/interviews/${encodeURIComponent(id)}`);
        if (active && remote) {
          setReport(remote);
        }
      } catch (err) {
        console.info('Interview report DB sync notice:', err.message);
      }
    }
    loadReport();
    return () => {
      active = false;
    };
  }, [id]);

  if (!report) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Interview Report Not Found</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We could not locate interview record {id}.
        </p>
        <Link to="/history" className="btn-primary mt-6 inline-flex">
          Back to History
        </Link>
      </div>
    );
  }

  const rubric = report.rubric || {
    technical: report.score,
    problemSolving: Math.max(50, report.score - 4),
    communication: Math.min(100, report.score + 5),
    confidence: Math.max(50, report.score - 2),
  };

  return (
    <div className="space-y-6">
      {/* Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to Interview History
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-outline inline-flex items-center gap-1.5 text-xs"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          <Link
            to={`/interview?category=${encodeURIComponent(report.category)}&mode=${encodeURIComponent(report.mode)}`}
            className="btn-primary inline-flex items-center gap-1.5 text-xs"
          >
            <RotateCcw size={14} /> Retake Interview
          </Link>
        </div>
      </div>

      {/* Main Scorecard Banner */}
      <div className="rounded-2xl bg-navy-900 p-6 text-white shadow-panel lg:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-signal-soft/20 px-2.5 py-0.5 text-xs font-semibold text-signal-soft">
                {report.category}
              </span>
              <span className="text-xs text-white/60">
                {report.mode} · {report.difficulty}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Interview Evaluation Report
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1"><Calendar size={13} /> {report.date}</span>
              <span className="flex items-center gap-1"><Clock size={13} /> {report.minutes} minutes</span>
              <span>Report ID: <code className="font-mono text-white/90">{report.id}</code></span>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start rounded-xl bg-navy-800 p-4 sm:self-auto">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-white">{report.score}</span>
                <span className="text-xs text-white/60">/ 100</span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-jade">
                {report.score >= 75 ? 'Placement Ready' : 'Needs Practice'}
              </p>
            </div>
            <ScorePill score={report.score} />
          </div>
        </div>

        {/* Summary note */}
        <p className="mt-6 border-t border-white/10 pt-4 text-sm leading-relaxed text-white/80">
          {report.summary}
        </p>
      </div>

      {/* 4 Rubric Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Technical Depth', val: rubric.technical, note: 'Core algorithm correctness & syntax' },
          { label: 'Problem Solving', val: rubric.problemSolving, note: 'Structured approach & edge-case care' },
          { label: 'Communication', val: rubric.communication, note: 'Clarity, conciseness & pacing' },
          { label: 'Confidence & Fluency', val: rubric.confidence, note: 'Composure and adaptability' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl bg-surface p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{metric.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink">{metric.val}%</span>
              <span className={`text-xs font-semibold ${metric.val >= 75 ? 'text-jade' : 'text-saffron'}`}>
                {metric.val >= 75 ? 'Strong' : 'Review'}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-paper">
              <div
                className={`h-full rounded-full ${metric.val >= 75 ? 'bg-jade' : 'bg-saffron'}`}
                style={{ width: `${metric.val}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">{metric.note}</p>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Identified Strengths">
          <ul className="space-y-2.5">
            {report.strengths?.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-soft">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-jade" />
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recommended Improvements">
          <ul className="space-y-2.5">
            {report.improvements?.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-soft">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-saffron" />
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Question-by-Question Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            Question-by-Question Breakdown ({report.questions?.length || 0})
          </h2>
          <span className="text-xs text-ink-soft">Evaluated with Model Answers</span>
        </div>

        {report.questions?.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-signal">Question {idx + 1}</span>
                <h3 className="font-display text-base font-semibold text-ink">
                  "{item.question}"
                </h3>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 font-display text-sm font-bold text-ink">
                {item.score} / 10
              </span>
            </div>

            {/* Candidate Answer */}
            <div className="mt-4 rounded-lg bg-paper p-3.5 text-xs">
              <span className="font-semibold text-ink-soft block mb-1">Your Stated Answer:</span>
              <p className="italic text-ink leading-relaxed">
                "{item.candidateAnswer}"
              </p>
            </div>

            {/* Evaluator Feedback */}
            <div className="mt-3 flex items-start gap-2 text-xs text-ink-soft">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-signal" />
              <p>
                <strong className="text-ink">AI Feedback:</strong> {item.feedback}
              </p>
            </div>

            {/* Model Answer */}
            <div className="mt-3 rounded-lg border border-jade/20 bg-jade-soft/30 p-3.5 text-xs">
              <span className="font-bold text-jade flex items-center gap-1.5 mb-1">
                <CheckCircle size={13} /> Benchmark Model Answer:
              </span>
              <p className="text-ink leading-relaxed">
                {item.modelAnswer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
