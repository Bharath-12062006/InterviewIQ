import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain, Calculator, Code2, Cpu, MessageSquareText, Puzzle,
  Search, Timer, ChevronRight, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react';
import {
  APTITUDE_SECTIONS, ONLINE_TESTS, findConceptById,
} from '../data/aptitudeCatalog';
import {
  getAllConceptsList,
  getAptitudeProgress,
  getQuestionsForConcept,
  saveAptitudeAnswer,
  saveOnlineTestResult,
} from '../data/aptitudeData';
import ConceptPractice from '../components/aptitude/ConceptPractice';
import OnlineTestRunner from '../components/aptitude/OnlineTestRunner';

const SECTION_ICONS = {
  'general-aptitude': Calculator,
  'verbal-reasoning': MessageSquareText,
  programming: Code2,
  'technical-mcqs': Cpu,
  puzzles: Puzzle,
  'online-test': Timer,
};

export default function AptitudePractice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSectionFilter, setActiveSectionFilter] = useState(
    searchParams.get('section') || 'all',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(getAptitudeProgress);

  const selectedConceptId = searchParams.get('topic');
  const selectedTestId = searchParams.get('test');

  const allConcepts = useMemo(() => getAllConceptsList(), []);

  const totalQuestionCount = useMemo(
    () => allConcepts.reduce((sum, item) => sum + getQuestionsForConcept(item.concept.id).length, 0),
    [allConcepts],
  );

  const solvedEntries = Object.values(progress.answers || {});
  const attemptedCount = solvedEntries.length;
  const correctCount = solvedEntries.filter((a) => a.isCorrect).length;
  const accuracyPct = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const handleOpenConcept = (conceptId) => {
    setSearchParams({ topic: conceptId });
  };

  const handleOpenTest = (testId) => {
    setSearchParams({ test: testId });
  };

  const handleBackToHub = () => {
    setSearchParams({});
  };

  const handleSelectAnswer = (questionId, selectedIndex, isCorrect) => {
    const updated = saveAptitudeAnswer(questionId, selectedIndex, isCorrect);
    setProgress(updated);
  };

  const handleCompleteTest = (result) => {
    const updated = saveOnlineTestResult(result);
    setProgress(updated);
  };

  // View 1: Timed Online Test Runner
  if (selectedTestId) {
    return (
      <OnlineTestRunner
        testId={selectedTestId}
        onExit={handleBackToHub}
        onCompleteTest={handleCompleteTest}
      />
    );
  }

  // View 2: Concept Practice Mode
  if (selectedConceptId) {
    const found = findConceptById(selectedConceptId);
    if (found) {
      const idx = allConcepts.findIndex((c) => c.concept.id === selectedConceptId);
      const prevConcept = idx > 0 ? allConcepts[idx - 1] : null;
      const nextConcept = idx >= 0 && idx < allConcepts.length - 1 ? allConcepts[idx + 1] : null;

      return (
        <ConceptPractice
          section={found.section}
          group={found.group}
          concept={found.concept}
          progress={progress}
          onSelectAnswer={handleSelectAnswer}
          onBack={handleBackToHub}
          onNavigateConcept={handleOpenConcept}
          prevConcept={prevConcept}
          nextConcept={nextConcept}
        />
      );
    }
  }

  // View 3: IndiaBIX-style All-Concepts Directory Hub
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleSections = APTITUDE_SECTIONS.filter(
    (s) => activeSectionFilter === 'all' || s.id === activeSectionFilter,
  )
    .map((section) => {
      if (!normalizedQuery) return section;
      const filteredGroups = section.groups
        .map((group) => ({
          ...group,
          concepts: group.concepts.filter(
            (c) =>
              c.name.toLowerCase().includes(normalizedQuery) ||
              c.summary.toLowerCase().includes(normalizedQuery) ||
              group.name.toLowerCase().includes(normalizedQuery) ||
              section.title.toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((g) => g.concepts.length > 0);
      return { ...section, groups: filteredGroups };
    })
    .filter((s) => s.groups.length > 0);

  const showOnlineTests =
    (activeSectionFilter === 'all' || activeSectionFilter === 'online-test') &&
    (!normalizedQuery ||
      'online test mock exam'.includes(normalizedQuery) ||
      ONLINE_TESTS.some((t) => t.title.toLowerCase().includes(normalizedQuery)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel dark:border dark:border-line lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-signal-soft">
              <Brain size={14} /> Complete Campus Aptitude & MCQ Hub
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Aptitude, Reasoning & Technical Practice
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-white/75">
              Master every topic across General Aptitude, Verbal & Reasoning, Programming Questions, Technical MCQs, Puzzles, and Timed Online Tests with formulas and step-by-step solutions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-navy-800 px-4 py-3">
              <p className="font-display text-xl font-bold text-white">{allConcepts.length}</p>
              <p className="text-[11px] text-white/60">Concepts</p>
            </div>
            <div className="rounded-xl bg-navy-800 px-4 py-3">
              <p className="font-display text-xl font-bold text-jade">
                {attemptedCount}/{totalQuestionCount}
              </p>
              <p className="text-[11px] text-white/60">Practiced</p>
            </div>
            <div className="rounded-xl bg-navy-800 px-4 py-3">
              <p className="font-display text-xl font-bold text-signal-soft">{accuracyPct}%</p>
              <p className="text-[11px] text-white/60">Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Section Filter Bar */}
      <div className="space-y-3 rounded-xl bg-surface p-4 shadow-panel">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-2.5 text-ink-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any concept (e.g. Trains, Blood Relations, Pointers, DBMS, Puzzles)..."
            className="w-full rounded-lg border border-line bg-paper py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSectionFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeSectionFilter === 'all'
                ? 'bg-signal text-white'
                : 'border border-line bg-paper text-ink-soft hover:text-ink'
            }`}
          >
            All Sections
          </button>
          {[
            ...APTITUDE_SECTIONS.map((s) => ({ id: s.id, label: s.title })),
            { id: 'online-test', label: 'Online Test' },
          ].map((tab) => {
            const Icon = SECTION_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeSectionFilter === tab.id
                    ? 'bg-signal text-white'
                    : 'border border-line bg-paper text-ink-soft hover:text-ink'
                }`}
              >
                {Icon && <Icon size={13} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* All Practice Sections & Every Concept Card */}
      <div className="space-y-6">
        {visibleSections.map((section) => {
          const Icon = SECTION_ICONS[section.id] || Sparkles;
          return (
            <section
              key={section.id}
              className="rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-signal">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                      {section.title}
                    </h2>
                    <p className="text-xs text-ink-soft">{section.subtitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink-soft border border-line">
                  {section.groups.reduce((acc, g) => acc + g.concepts.length, 0)} Concepts
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {section.groups.map((group) => (
                  <div key={group.name}>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-signal">
                      {group.name}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.concepts.map((concept) => {
                        const qs = getQuestionsForConcept(concept.id);
                        const doneCount = qs.filter(
                          (q) => progress.answers[q.id] !== undefined,
                        ).length;

                        return (
                          <button
                            key={concept.id}
                            type="button"
                            onClick={() => handleOpenConcept(concept.id)}
                            className="group flex flex-col justify-between rounded-xl border border-line bg-paper/70 p-4 text-left transition-all hover:border-signal/60 hover:bg-signal-soft/25"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-sm font-bold text-ink group-hover:text-signal">
                                  {concept.name}
                                </span>
                                <ChevronRight
                                  size={15}
                                  className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
                                />
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                                {concept.summary}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5 text-[11px] font-semibold">
                              <span className="text-ink-faint">{qs.length} MCQs + Formulas</span>
                              {doneCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-jade">
                                  <CheckCircle2 size={12} /> {doneCount}/{qs.length} done
                                </span>
                              ) : (
                                <span className="text-signal">Practice →</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Online Tests Section */}
        {showOnlineTests && (
          <section className="rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-saffron-soft text-saffron">
                  <Timer size={20} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                    Online Tests (Timed Mock Assessments)
                  </h2>
                  <p className="text-xs text-ink-soft">
                    Simulate real campus screening tests with countdown timers, question palettes, and instant score reports.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink-soft border border-line">
                {ONLINE_TESTS.length} Tests
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {ONLINE_TESTS.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-col justify-between rounded-xl border border-line bg-paper/70 p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-signal-soft px-2.5 py-0.5 text-[11px] font-bold text-signal-deep">
                        {test.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-ink-soft">
                        {test.questionCount} Questions · {test.durationMinutes} Mins
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-display text-base font-bold text-ink">
                      {test.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {test.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTest(test.id)}
                    className="btn-primary mt-4 w-full py-2 text-xs"
                  >
                    Start Timed Online Test <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            {progress.tests?.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Recent Online Test Scores
                </h3>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {progress.tests.slice(0, 6).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-2.5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-semibold text-ink">{t.title}</p>
                        <p className="text-[11px] text-ink-faint">
                          {t.correctCount}/{t.totalQuestions} correct · {t.date}
                        </p>
                      </div>
                      <span className="font-display text-sm font-bold text-signal">
                        {t.scorePct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {visibleSections.length === 0 && !showOnlineTests && (
          <div className="rounded-xl border border-line bg-surface p-10 text-center shadow-panel">
            <p className="font-display text-base font-bold text-ink">
              No matching aptitude concepts found
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Try clearing your search filter or switching to "All Sections".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
