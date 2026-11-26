import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Eye, EyeOff, RotateCcw, XCircle,
} from 'lucide-react';
import Panel from '../ui/Panel';
import { getQuestionsForConcept } from '../../data/aptitudeData';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function ConceptPractice({
  section,
  group,
  concept,
  progress,
  onSelectAnswer,
  onBack,
  onNavigateConcept,
  prevConcept,
  nextConcept,
}) {
  const questions = getQuestionsForConcept(concept.id);
  const [showFormulas, setShowFormulas] = useState(true);
  const [revealedExplanations, setRevealedExplanations] = useState({});
  const [localSelections, setLocalSelections] = useState({});

  const toggleExplanation = (qId) => {
    setRevealedExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleOptionClick = (q, idx) => {
    setLocalSelections((prev) => ({ ...prev, [q.id]: idx }));
    setRevealedExplanations((prev) => ({ ...prev, [q.id]: true }));
    onSelectAnswer(q.id, idx, idx === q.answerIndex);
  };

  const handleResetConcept = () => {
    setLocalSelections({});
    setRevealedExplanations({});
  };

  const answeredInConcept = questions.filter(
    (q) => localSelections[q.id] !== undefined || progress.answers[q.id] !== undefined,
  ).length;
  const correctInConcept = questions.filter((q) => {
    const sel = localSelections[q.id] ?? progress.answers[q.id]?.selectedIndex;
    return sel === q.answerIndex;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-semibold text-ink hover:bg-paper"
          >
            <ArrowLeft size={14} /> All Concepts
          </button>
          <span>/</span>
          <span className="font-semibold text-signal">{section.title}</span>
          <span>/</span>
          <span>{group.name}</span>
          <span>/</span>
          <span className="font-semibold text-ink">{concept.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-signal-soft px-3 py-1.5 text-xs font-bold text-signal-deep">
            Score: {correctInConcept} / {questions.length} ({answeredInConcept} attempted)
          </span>
          <button
            type="button"
            onClick={handleResetConcept}
            className="btn-outline px-3 py-1.5 text-xs"
            title="Clear current view answers"
          >
            <RotateCcw size={13} /> Reset View
          </button>
        </div>
      </div>

      {/* Topic Header */}
      <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel dark:border dark:border-line">
        <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
          {section.title} · {group.name}
        </span>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{concept.name}</h1>
        <p className="mt-1.5 text-sm text-white/75">{concept.summary}</p>
      </div>

      {/* Important Formulas & Concepts (IndiaBIX-style reference block) */}
      {concept.formulas?.length > 0 && (
        <Panel
          title="Important Formulas & Key Concepts"
          description="Review core rules and shortcuts before solving the practice set"
          action={
            <button
              type="button"
              onClick={() => setShowFormulas((s) => !s)}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              <BookOpen size={13} />
              {showFormulas ? 'Hide' : 'Show'}
              {showFormulas ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          }
        >
          {showFormulas && (
            <ul className="space-y-2 text-sm text-ink">
              {concept.formulas.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-3.5 py-2.5 font-mono text-xs leading-relaxed"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-soft text-[11px] font-bold text-signal-deep">
                    {i + 1}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const selected = localSelections[q.id] ?? progress.answers[q.id]?.selectedIndex;
          const isAnswered = selected !== undefined;
          const showExp = Boolean(revealedExplanations[q.id]);

          return (
            <div key={q.id} className="rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-signal-soft font-display text-xs font-bold text-signal-deep">
                    {qIdx + 1}
                  </span>
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-ink">
                    {q.question}
                  </p>
                </div>
              </div>

              {/* Options A-D */}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {q.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrectOption = idx === q.answerIndex;

                  let optionStyle =
                    'border-line bg-paper text-ink hover:border-signal/60 hover:bg-signal-soft/30';
                  if (isAnswered) {
                    if (isCorrectOption) {
                      optionStyle = 'border-jade bg-jade-soft/70 text-ink font-semibold';
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = 'border-rose bg-rose-soft/70 text-rose font-semibold';
                    } else {
                      optionStyle = 'border-line/70 bg-paper/60 text-ink-soft';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionClick(q, idx)}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left text-xs transition-all ${optionStyle}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                            isAnswered && isCorrectOption
                              ? 'border-jade bg-jade text-white'
                              : isAnswered && isSelected && !isCorrectOption
                              ? 'border-rose bg-rose text-white'
                              : 'border-line bg-surface text-ink-soft'
                          }`}
                        >
                          {OPTION_LABELS[idx]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </span>

                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 size={16} className="shrink-0 text-jade" />
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <XCircle size={16} className="shrink-0 text-rose" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action bar + Explanation */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => toggleExplanation(q.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal hover:underline"
                >
                  {showExp ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showExp ? 'Hide Answer & Explanation' : 'View Answer & Explanation'}
                </button>

                {isAnswered && (
                  <span
                    className={`text-xs font-bold ${
                      selected === q.answerIndex ? 'text-jade' : 'text-rose'
                    }`}
                  >
                    {selected === q.answerIndex
                      ? 'Correct Answer!'
                      : `Incorrect — Correct Option: ${OPTION_LABELS[q.answerIndex]}`}
                  </span>
                )}
              </div>

              {showExp && (
                <div className="mt-3 rounded-lg border border-jade/25 bg-jade-soft/35 p-3.5 text-xs leading-relaxed text-ink">
                  <p className="font-bold text-jade">
                    Answer: Option {OPTION_LABELS[q.answerIndex]} ({q.options[q.answerIndex]})
                  </p>
                  <p className="mt-1 text-ink-soft">
                    <strong className="text-ink">Explanation:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Previous / Next Concept Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {prevConcept ? (
          <button
            type="button"
            onClick={() => onNavigateConcept(prevConcept.concept.id)}
            className="btn-outline text-xs"
          >
            <ArrowLeft size={14} /> Previous: {prevConcept.concept.name}
          </button>
        ) : (
          <span />
        )}

        {nextConcept && (
          <button
            type="button"
            onClick={() => onNavigateConcept(nextConcept.concept.id)}
            className="btn-primary text-xs"
          >
            Next: {nextConcept.concept.name} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
