import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  Play,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Panel from '../components/ui/Panel';
import ScorePill from '../components/ui/ScorePill';
import { api } from '../lib/api';

function formatLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InterviewReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const remote = await api.get(`/interview/report/${encodeURIComponent(id)}`);
        if (active) setReport(remote);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load interview report.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => {
      active = false;
    };
  }, [id, reloadNonce]);

  const metricChartData = useMemo(() => {
    if (!report) return [];
    const rows = [];
    const tech = report.technicalEvaluation || {};
    const comm = report.communicationEvaluation || {};
    const rubric = report.rubric || {};

    const addEntries = (source, prefix) => {
      Object.entries(source).forEach(([k, v]) => {
        if (typeof v === 'number' && !Number.isNaN(v)) {
          rows.push({
            metric: formatLabel(k),
            group: prefix,
            score: Math.round(v),
          });
        }
      });
    };

    if (Object.keys(tech).length > 0 || Object.keys(comm).length > 0) {
      addEntries(tech, 'Technical');
      addEntries(comm, 'Communication');
    } else {
      addEntries(rubric, 'Rubric');
    }

    return rows;
  }, [report]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <Panel className="p-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-signal" />
          <p className="mt-4 text-sm text-ink-soft">Loading your interview evaluation report...</p>
        </Panel>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Panel className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Interview Report Not Found</h2>
          <p className="mt-2 text-sm text-rose-500">
            {error || `No evaluation report found for session "${id}".`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              Retry Load
            </button>
            <Link
              to="/history"
              className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              View Interview History
            </Link>
            <Link
              to="/interview"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white dark:bg-signal"
            >
              Start New Interview
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  const questions = Array.isArray(report.questions) ? report.questions : [];
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  const improvements = Array.isArray(report.improvements) ? report.improvements : [];
  const missingConcepts = Array.isArray(report.missingConcepts) ? report.missingConcepts : [];
  const incorrectConcepts = Array.isArray(report.incorrectConcepts) ? report.incorrectConcepts : [];
  const recommendedSubjects = Array.isArray(report.recommendedSubjects) ? report.recommendedSubjects : [];
  const learningPlan = Array.isArray(report.learningPlan)
    ? report.learningPlan
    : report.learningPlan
      ? [report.learningPlan]
      : [];

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interview History
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/interview"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-signal"
          >
            <Play className="h-3.5 w-3.5" />
            New Mock Interview
          </Link>
        </div>
      </div>

      {/* Executive Summary & Overall Performance */}
      <Panel className="p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-signal/10 px-2.5 py-0.5 text-xs font-semibold text-signal">
                <Sparkles className="h-3.5 w-3.5" />
                {report.performanceLevel || 'Evaluated Session'}
              </span>
              {report.jobRole && (
                <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                  {report.jobRole}
                </span>
              )}
              <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                {report.category}
              </span>
              <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                {report.mode}
              </span>
              <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                {report.difficulty}
              </span>
              {report.resumeFileName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-jade/10 px-2.5 py-0.5 text-xs font-medium text-jade">
                  <FileText className="h-3 w-3" />
                  {report.resumeFileName}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-ink">
              Interview Performance Report
            </h1>
            <p className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {report.minutes || Math.max(1, Math.round((report.elapsedSeconds || 60) / 60))} mins ·{' '}
                {questions.length} question{questions.length === 1 ? '' : 's'} evaluated
              </span>
              {report.createdAt && (
                <span>· {new Date(report.createdAt).toLocaleString()}</span>
              )}
              {report.engine && <span>· Engine: {report.engine}</span>}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end rounded-xl border border-line bg-paper px-5 py-3 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              Overall Score
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-3xl font-bold text-ink">
                {typeof report.score === 'number' ? `${report.score}%` : '—'}
              </span>
              {typeof report.score === 'number' && <ScorePill score={report.score} />}
            </div>
          </div>
        </div>

        {report.summary && (
          <div className="mt-5 rounded-xl border border-line bg-paper p-4 text-sm leading-relaxed text-ink-soft">
            {report.summary}
          </div>
        )}
      </Panel>

      {/* Competency Chart + Technical / Communication Split */}
      {metricChartData.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-12">
          <Panel className="p-6 lg:col-span-7">
            <h2 className="font-display text-base font-semibold text-ink">
              Technical & Communication Breakdown
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Evidence-based scores derived from your submitted responses.
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricChartData} margin={{ top: 8, right: 12, left: -12, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-6 lg:col-span-5">
            <h2 className="font-display text-base font-semibold text-ink">Evaluation Pillars</h2>
            <div className="mt-4 space-y-3">
              {metricChartData.map((row) => (
                <div key={row.metric}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">
                      {row.metric}{' '}
                      <span className="text-[11px] text-ink-mute">({row.group})</span>
                    </span>
                    <span className="font-semibold text-ink">{row.score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-signal"
                      style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Strengths & Improvement Areas */}
      <div className="grid gap-5 md:grid-cols-2">
        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-jade" />
            <h2 className="font-display text-base font-semibold text-ink">Strongest Areas</h2>
          </div>
          {strengths.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-lg border border-line bg-paper p-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-jade" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-ink-mute">No specific strength highlights recorded.</p>
          )}
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-base font-semibold text-ink">Areas to Improve</h2>
          </div>
          {improvements.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {improvements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-lg border border-line bg-paper p-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-ink-mute">No critical weakness gaps flagged.</p>
          )}
        </Panel>
      </div>

      {/* Missing Concepts, Incorrect Concepts, Recommended Subjects & Learning Plan */}
      {(missingConcepts.length > 0 || incorrectConcepts.length > 0 || recommendedSubjects.length > 0 || learningPlan.length > 0) && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-base font-semibold text-ink">Missing Concepts</h2>
            </div>
            {missingConcepts.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {missingConcepts.map((concept, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-mute">None flagged.</p>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <h2 className="font-display text-base font-semibold text-ink">Incorrect Explanations</h2>
            </div>
            {incorrectConcepts.length > 0 ? (
              <ul className="mt-4 space-y-2 text-xs text-ink-soft">
                {incorrectConcepts.map((concept, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 font-medium text-rose-500"
                  >
                    {concept}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-ink-mute">No factually incorrect concepts flagged.</p>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-signal" />
              <h2 className="font-display text-base font-semibold text-ink">Recommended Subjects</h2>
            </div>
            {recommendedSubjects.length > 0 ? (
              <ul className="mt-4 space-y-2 text-xs text-ink-soft">
                {recommendedSubjects.map((subj, i) => (
                  <li key={i} className="rounded-lg border border-line bg-paper px-3 py-2 font-medium text-ink">
                    {subj}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-ink-mute">Continue reinforcing current domain fundamentals.</p>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-jade" />
              <h2 className="font-display text-base font-semibold text-ink">Personalized Learning Roadmap</h2>
            </div>
            {learningPlan.length > 0 ? (
              <ol className="mt-4 space-y-2 text-xs text-ink-soft">
                {learningPlan.map((step, i) => (
                  <li key={i} className="rounded-lg border border-line bg-paper p-2.5 leading-relaxed">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-signal">
                        {i + 1}. {typeof step === 'object' && step?.topic ? step.topic : `Step ${i + 1}`}
                      </span>
                      {typeof step === 'object' && step?.priority && (
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase font-semibold text-ink-mute border border-line">
                          {step.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1">
                      {typeof step === 'string'
                        ? step
                        : step?.action || step?.topic || step?.title || JSON.stringify(step)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-ink-mute">No custom study steps generated.</p>
            )}
          </Panel>
        </div>
      )}

      {/* Detailed Question-by-Question Evaluation */}
      <Panel className="p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Detailed Question-by-Question Review
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Exact questions, your recorded responses, multi-axis scoring, and ideal model answers.
        </p>

        {questions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-line bg-paper p-5 text-sm text-ink-soft">
            No answers were submitted during this session before it ended.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {questions.map((q, idx) => {
              const correctItems = Array.isArray(q.what_was_correct)
                ? q.what_was_correct
                : q.what_was_correct
                  ? [q.what_was_correct]
                  : [];
              const missingItems = Array.isArray(q.what_was_missing)
                ? q.what_was_missing
                : q.what_was_missing
                  ? [q.what_was_missing]
                  : [];
              const subAxes = [
                ['Technical', q.technical_accuracy],
                ['Conceptual', q.conceptual_understanding],
                ['Completeness', q.completeness],
                ['Relevance', q.relevance],
                ['Depth', q.depth],
                ['Clarity', q.communication_clarity],
              ].filter(([, val]) => typeof val === 'number' && !Number.isNaN(val));

              return (
                <div key={q.id || idx} className="rounded-xl border border-line bg-paper p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-signal">Question {idx + 1}</span>
                        {q.topic && (
                          <span className="rounded bg-surface px-2 py-0.5 text-ink-soft border border-line">
                            {q.topic}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className="rounded bg-surface px-2 py-0.5 capitalize text-ink-soft border border-line">
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-ink">{q.question}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft">
                        {typeof q.score === 'number' ? `${q.score <= 10 ? q.score : (q.score / 10).toFixed(1)}/10` : ''}
                      </span>
                      <ScorePill
                        score={Math.round(
                          Number(q.score ?? 0) <= 10 ? Number(q.score ?? 0) * 10 : Number(q.score ?? 0)
                        )}
                      />
                    </div>
                  </div>

                  {subAxes.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      {subAxes.map(([label, val]) => (
                        <div key={label} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-center">
                          <div className="text-[10px] uppercase tracking-wide text-ink-mute">{label}</div>
                          <div className="text-xs font-bold text-ink">{Math.round(val)}%</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                      Your Answer
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-sm text-ink-soft">
                      {q.candidateAnswer || 'No answer recorded.'}
                    </p>
                  </div>

                  {q.feedback && (
                    <p className="text-xs leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink">AI Summary: </span>
                      {q.feedback}
                    </p>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-jade/25 bg-jade/5 p-3">
                      <p className="text-xs font-semibold text-jade">What Was Correct</p>
                      {correctItems.length > 0 ? (
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-ink-soft">
                          {correctItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-ink-mute">None highlighted.</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                      <p className="text-xs font-semibold text-amber-500">What Was Missing</p>
                      {missingItems.length > 0 ? (
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-ink-soft">
                          {missingItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-ink-mute">No major gaps identified.</p>
                      )}
                    </div>
                  </div>

                  {q.suggested_improvement && (
                    <p className="text-xs leading-relaxed text-ink-soft">
                      <span className="font-semibold text-signal">How to Improve: </span>
                      {q.suggested_improvement}
                    </p>
                  )}

                  {(q.ideal_answer || q.modelAnswer) && (
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <p className="text-xs font-semibold text-ink">Ideal Reference Answer</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                        {q.ideal_answer || q.modelAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
