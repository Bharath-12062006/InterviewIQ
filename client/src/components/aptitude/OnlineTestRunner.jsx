import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, RotateCcw, Send, XCircle,
} from 'lucide-react';
import { buildOnlineTestQuestions } from '../../data/aptitudeData';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function OnlineTestRunner({ testId, onExit, onCompleteTest }) {
  const [{ test, questions }, setSession] = useState(() => buildOnlineTestQuestions(testId));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [marked, setMarked] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(test.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (secondsLeft === 0 && !submitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return;
    setResponses((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleToggleMark = (qId) => {
    setMarked((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correctCount = questions.reduce(
      (acc, q) => acc + (responses[q.id] === q.answerIndex ? 1 : 0),
      0,
    );
    const scorePct = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
    onCompleteTest({
      id: `${test.id}-${Date.now()}`,
      testId: test.id,
      title: test.title,
      correctCount,
      totalQuestions: questions.length,
      scorePct,
      timeSpentSeconds: test.durationMinutes * 60 - secondsLeft,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRetake = () => {
    const fresh = buildOnlineTestQuestions(testId);
    setSession(fresh);
    setCurrentIdx(0);
    setResponses({});
    setMarked({});
    setSecondsLeft(fresh.test.durationMinutes * 60);
    setSubmitted(false);
  };

  const currentQ = questions[currentIdx];
  const answeredCount = questions.filter((q) => responses[q.id] !== undefined).length;
  const correctCount = questions.reduce(
    (acc, q) => acc + (responses[q.id] === q.answerIndex ? 1 : 0),
    0,
  );
  const scorePct = Math.round((correctCount / Math.max(questions.length, 1)) * 100);

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="btn-outline text-xs"
          >
            <ArrowLeft size={14} /> Back to Aptitude Hub
          </button>
          <button
            type="button"
            onClick={handleRetake}
            className="btn-primary text-xs"
          >
            <RotateCcw size={14} /> Retake Test
          </button>
        </div>

        {/* Scorecard */}
        <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel dark:border dark:border-line sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
            Online Test Result
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{test.title}</h1>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-navy-800 p-4">
              <p className="text-xs text-white/60">Final Score</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">{scorePct}%</p>
            </div>
            <div className="rounded-xl bg-navy-800 p-4">
              <p className="text-xs text-white/60">Correct Answers</p>
              <p className="mt-1 font-display text-3xl font-bold text-jade">
                {correctCount} / {questions.length}
              </p>
            </div>
            <div className="rounded-xl bg-navy-800 p-4">
              <p className="text-xs text-white/60">Attempted</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">
                {answeredCount} / {questions.length}
              </p>
            </div>
            <div className="rounded-xl bg-navy-800 p-4">
              <p className="text-xs text-white/60">Time Taken</p>
              <p className="mt-1 font-display text-3xl font-bold text-signal-soft">
                {formatTime(test.durationMinutes * 60 - secondsLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Solution Review */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">Detailed Solution Review</h2>
          {questions.map((q, idx) => {
            const userChoice = responses[q.id];
            const isCorrect = userChoice === q.answerIndex;
            return (
              <div key={q.id} className="rounded-xl border border-line bg-surface p-5 shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-deep">
                    Q{idx + 1} · {q.sectionTitle} · {q.conceptName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      isCorrect ? 'text-jade' : 'text-rose'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {userChoice === undefined
                      ? 'Unattempted'
                      : isCorrect
                      ? 'Correct'
                      : `Wrong (Selected ${OPTION_LABELS[userChoice]})`}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold text-ink">{q.question}</p>

                <div className="mt-3 rounded-lg border border-jade/25 bg-jade-soft/35 p-3 text-xs">
                  <p className="font-bold text-jade">
                    Correct Answer: {OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}
                  </p>
                  <p className="mt-1 text-ink-soft leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy-900 px-6 py-4 text-white shadow-panel dark:border dark:border-line">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
            Online Timed Test
          </span>
          <h2 className="font-display text-lg font-bold">{test.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
              secondsLeft < 120 ? 'bg-rose text-white' : 'bg-navy-800 text-white'
            }`}
          >
            <Clock size={14} />
            <span className="font-mono">{formatTime(secondsLeft)}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary px-4 py-1.5 text-xs"
          >
            <Send size={13} /> Submit Test
          </button>
          <button
            type="button"
            onClick={onExit}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Split: Question Area + Palette */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {currentQ && (
            <div className="rounded-xl border border-line bg-surface p-6 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-signal-soft px-2.5 py-1 text-xs font-bold text-signal-deep">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {currentQ.sectionTitle} · {currentQ.conceptName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleMark(currentQ.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                    marked[currentQ.id]
                      ? 'border-saffron bg-saffron-soft text-saffron'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  <Flag size={12} /> {marked[currentQ.id] ? 'Marked' : 'Mark for Review'}
                </button>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-ink">
                {currentQ.question}
              </p>

              <div className="mt-5 space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const selected = responses[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-xs transition-all ${
                        selected
                          ? 'border-signal bg-signal-soft/70 font-semibold text-ink ring-1 ring-signal'
                          : 'border-line bg-paper text-ink hover:border-signal/50'
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                          selected
                            ? 'border-signal bg-signal text-white'
                            : 'border-line bg-surface text-ink-soft'
                        }`}
                      >
                        {OPTION_LABELS[idx]}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  <ArrowLeft size={14} /> Previous
                </button>

                {currentIdx + 1 < questions.length ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="btn-primary px-4 py-1.5 text-xs"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn-primary px-4 py-1.5 text-xs"
                  >
                    Finish & Submit <Send size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Question Palette */}
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel h-fit">
          <h3 className="font-display text-sm font-bold text-ink">Question Palette</h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            Answered: {answeredCount} / {questions.length}
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = responses[q.id] !== undefined;
              const isMarked = Boolean(marked[q.id]);

              let paletteCls = 'border-line bg-paper text-ink-soft';
              if (isMarked) paletteCls = 'border-saffron bg-saffron-soft text-saffron';
              else if (isAnswered) paletteCls = 'border-jade bg-jade-soft text-jade font-bold';

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`grid h-9 place-items-center rounded-lg border text-xs font-semibold transition-all ${paletteCls} ${
                    isCurrent ? 'ring-2 ring-signal ring-offset-1 ring-offset-surface' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-1.5 border-t border-line pt-3 text-[11px] text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-jade bg-jade-soft" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-saffron bg-saffron-soft" /> Marked for Review
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-line bg-paper" /> Not Answered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
