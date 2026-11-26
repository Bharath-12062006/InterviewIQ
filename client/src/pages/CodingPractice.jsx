import { useState } from 'react';
import { 
  Play, Send, RefreshCw, CheckCircle, XCircle, Code2, 
  Terminal, Sparkles, HelpCircle, ChevronRight, Check, AlertCircle 
} from 'lucide-react';
import { mockCodingProblems } from '../data/mock';

export default function CodingPractice() {
  const [selectedProblemId, setSelectedProblemId] = useState(mockCodingProblems[0].id);
  const [language, setLanguage] = useState('python');
  
  const problem = mockCodingProblems.find((p) => p.id === selectedProblemId) || mockCodingProblems[0];
  const [code, setCode] = useState(problem.starterCode[language]);
  
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'solution' | 'submissions'
  const [consoleTab, setConsoleTab] = useState('testcases'); // 'testcases' | 'output'
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const handleSelectProblem = (id) => {
    setSelectedProblemId(id);
    const newProb = mockCodingProblems.find((p) => p.id === id);
    if (newProb) {
      setCode(newProb.starterCode[language]);
      setRunResult(null);
      setSubmitResult(null);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang]);
    setRunResult(null);
    setSubmitResult(null);
  };

  const handleResetCode = () => {
    setCode(problem.starterCode[language]);
    setRunResult(null);
    setSubmitResult(null);
  };

  const handleRunCode = () => {
    setRunning(true);
    setConsoleTab('output');
    setSubmitResult(null);

    setTimeout(() => {
      setRunning(false);
      setRunResult({
        status: 'Success',
        runtime: '48 ms (Beats 82.4% of submissions)',
        memory: '16.2 MB (Beats 74.1%)',
        tests: problem.testCases.filter((tc) => !tc.isHidden).map((tc, idx) => ({
          name: `Test Case ${idx + 1}`,
          input: tc.input,
          expected: tc.expected,
          actual: tc.expected,
          passed: true,
        })),
      });
    }, 900);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setConsoleTab('output');
    setRunResult(null);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitResult({
        verdict: 'Accepted',
        totalPassed: problem.testCases.length,
        totalCases: problem.testCases.length,
        runtime: '52 ms',
        memory: '16.5 MB',
        complexity: problem.optimalComplexity,
        hiddenCasesPassed: true,
      });
    }, 1400);
  };

  // Generate line numbers for editor
  const lines = code.split('\n');

  return (
    <div className="space-y-4">
      {/* Top Bar: Problem Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface p-4 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-signal" />
            <select
              value={selectedProblemId}
              onChange={(e) => handleSelectProblem(e.target.value)}
              className="rounded-lg border border-line bg-paper px-3 py-1.5 font-display text-sm font-bold text-ink"
            >
              {mockCodingProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${
            problem.difficulty === 'Easy'
              ? 'bg-jade-soft text-jade'
              : problem.difficulty === 'Medium'
              ? 'bg-saffron-soft text-saffron'
              : 'bg-rose-soft text-rose'
          }`}>
            {problem.difficulty}
          </span>
          <span className="hidden text-xs text-ink-soft sm:inline">
            Acceptance: {problem.acceptance}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (ES6)</option>
            <option value="java">Java 17</option>
            <option value="cpp">C++ 20</option>
          </select>

          <button
            type="button"
            onClick={handleResetCode}
            className="btn-outline px-2.5 py-1.5 text-xs"
            title="Reset Starter Code"
          >
            <RefreshCw size={13} />
          </button>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={running || submitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
          >
            <Play size={13} className="text-signal" />
            {running ? 'Running...' : 'Run Code'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={running || submitting}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Send size={13} />
            {submitting ? 'Evaluating...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Problem Description vs Code Editor */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Side: Problem Statement & Examples */}
        <div className="flex flex-col rounded-xl bg-surface shadow-panel h-[640px] overflow-hidden">
          <div className="flex border-b border-line bg-paper/50 px-4">
            <button
              onClick={() => setActiveTab('description')}
              className={`border-b-2 py-3 px-3 text-xs font-bold transition-colors ${
                activeTab === 'description'
                  ? 'border-signal text-signal'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`border-b-2 py-3 px-3 text-xs font-bold transition-colors ${
                activeTab === 'solution'
                  ? 'border-signal text-signal'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Editorial & Complexity
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-ink-soft leading-relaxed">
            {activeTab === 'description' && (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-lg font-bold text-ink">{problem.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                      {problem.category}
                    </span>
                  </div>
                </div>

                <div className="prose prose-sm text-ink text-xs whitespace-pre-wrap">
                  {problem.description}
                </div>

                {/* Examples */}
                <div className="space-y-3 pt-2">
                  <p className="font-bold text-ink">Examples:</p>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="rounded-lg bg-paper p-3 font-mono space-y-1">
                      <p><strong className="text-ink">Input:</strong> {ex.input}</p>
                      <p><strong className="text-ink">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-ink-soft font-sans mt-1">
                          <strong>Explanation:</strong> {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-1.5 pt-2">
                  <p className="font-bold text-ink">Constraints:</p>
                  <ul className="list-disc pl-5 font-mono space-y-1 text-ink-soft">
                    {problem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-3">
                <div className="rounded-lg bg-signal-soft/40 p-3 text-signal-deep">
                  <p className="font-bold">Optimal Asymptotic Complexity:</p>
                  <p className="mt-0.5 font-mono font-semibold">{problem.optimalComplexity}</p>
                </div>
                <p className="text-ink leading-relaxed">
                  For campus interviews at tier-1 companies, the brute force approach is evaluated first, followed by hash-map index lookup to reduce polynomial time to linear time.
                </p>
                <div className="rounded-lg bg-paper p-3 text-ink-soft space-y-2">
                  <p className="font-bold text-ink">Approach Breakdown:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Maintain an auxiliary hash map or two pointers depending on sorting invariants.</li>
                    <li>Iterate through the collection while checking complement values in O(1) expected time.</li>
                    <li>Handle edge cases such as duplicate values, empty arrays, and negative keys.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Code Editor & Console Output */}
        <div className="flex flex-col rounded-xl bg-navy-950 shadow-panel h-[640px] overflow-hidden text-white">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-navy-800 bg-navy-900 px-4 py-2 text-xs">
            <span className="font-mono text-white/70">Solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}</span>
            <span className="text-[11px] text-white/40">Monaco Dark Mode · UTF-8</span>
          </div>

          {/* Code Textarea with line numbers */}
          <div className="flex flex-1 overflow-hidden font-mono text-xs">
            {/* Line numbers */}
            <div className="select-none bg-navy-950 py-3 px-2 text-right text-white/30 border-r border-navy-800">
              {lines.map((_, i) => (
                <div key={i} className="leading-5 h-5">{i + 1}</div>
              ))}
            </div>

            {/* Editor Canvas */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="flex-1 resize-none bg-transparent py-3 px-3 font-mono text-xs leading-5 text-white/90 focus:outline-none"
            />
          </div>

          {/* Bottom Console Drawer */}
          <div className="border-t border-navy-800 bg-navy-900 h-52 flex flex-col">
            <div className="flex items-center justify-between border-b border-navy-800 px-4 py-1.5 text-xs">
              <div className="flex gap-4">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`font-semibold transition-colors ${
                    consoleTab === 'testcases' ? 'text-signal-soft' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Test Cases ({problem.testCases.length})
                </button>
                <button
                  onClick={() => setConsoleTab('output')}
                  className={`font-semibold transition-colors ${
                    consoleTab === 'output' ? 'text-signal-soft' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Execution Console {runResult || submitResult ? '●' : ''}
                </button>
              </div>
              <span className="text-[11px] text-white/40 flex items-center gap-1">
                <Terminal size={12} /> Sandbox V8 Engine
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
              {consoleTab === 'testcases' && (
                <div className="space-y-2">
                  {problem.testCases.map((tc, idx) => (
                    <div key={idx} className="rounded bg-navy-950 p-2 text-white/80 flex items-center justify-between">
                      <div>
                        <span className="text-white/50">Case {idx + 1}: </span>
                        <span>{tc.input}</span>
                      </div>
                      <span className="text-white/40 text-[11px]">
                        {tc.isHidden ? 'Hidden Case' : `Expected: ${tc.expected}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {consoleTab === 'output' && (
                <div>
                  {running && (
                    <p className="text-signal-soft animate-pulse">Running test cases against sandbox...</p>
                  )}
                  {submitting && (
                    <p className="text-signal-soft animate-pulse">Running all hidden verification suites...</p>
                  )}

                  {runResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-jade font-bold">
                        <CheckCircle size={15} /> All Sample Test Cases Passed!
                      </div>
                      <p className="text-white/60">Runtime: {runResult.runtime}</p>
                      <p className="text-white/60">Memory: {runResult.memory}</p>
                    </div>
                  )}

                  {submitResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-jade font-bold text-sm">
                        <CheckCircle size={16} /> Solution Accepted! (100% Passed)
                      </div>
                      <div className="flex flex-wrap gap-4 text-white/80">
                        <span>Runtime: <strong className="text-white">{submitResult.runtime}</strong></span>
                        <span>Memory: <strong className="text-white">{submitResult.memory}</strong></span>
                        <span>Complexity: <strong className="text-white">{submitResult.complexity}</strong></span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        Passed {submitResult.totalPassed} / {submitResult.totalCases} test cases (including hidden regression tests).
                      </p>
                    </div>
                  )}

                  {!running && !submitting && !runResult && !submitResult && (
                    <p className="text-white/40 italic">
                      Click "Run Code" to test against visible sample inputs or "Submit" for full verification.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
