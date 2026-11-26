import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mic, MicOff, Volume2, Sparkles, Send, ArrowRight, 
  Clock, ShieldAlert, CheckCircle, RefreshCw, MessageSquare, AlertCircle
} from 'lucide-react';
import { addInterview } from '../data/mock';
import { api } from '../lib/api';

const QUESTION_BANK = {
  'DSA': [
    {
      q: 'Explain the difference between Dijkstra’s algorithm and Bellman-Ford algorithm. When is Bellman-Ford required?',
      followUp: 'How would you detect a negative cycle using Bellman-Ford?',
      model: 'Dijkstra works with non-negative edge weights using a greedy min-heap in O((V+E)logV). Bellman-Ford handles negative weights and detects negative weight cycles by relaxing all edges V-1 times in O(V*E).'
    },
    {
      q: 'Given an array of integers, how would you find the length of the longest subarray having sum equal to K?',
      followUp: 'What if the array contains negative numbers as well?',
      model: 'For non-negative numbers, a sliding window works in O(N) time and O(1) space. If negative numbers exist, use a prefix sum hash map storing first occurrences in O(N) time and O(N) space.'
    },
    {
      q: 'How does a Trie data structure work, and what are its performance advantages over a Hash Table for string prefix lookups?',
      followUp: 'What is the memory trade-off of a naive Trie and how can it be compacted?',
      model: 'A Trie stores characters along branch paths, allowing prefix queries in O(L) where L is prefix length, independent of the number of keys. Hash tables require hashing full strings and lack ordered prefix traversal.'
    }
  ],
  'DBMS': [
    {
      q: 'Explain the ACID properties of a relational database management system with real-world banking examples.',
      followUp: 'How does a write-ahead log (WAL) guarantee durability during sudden power failures?',
      model: 'Atomicity (all-or-nothing), Consistency (integrity constraints), Isolation (concurrent safety), and Durability (committed changes persist). WAL logs transactions to disk before modifying actual data pages.'
    },
    {
      q: 'Compare B-Tree and B+ Tree indexing structures. Why do almost all production relational engines prefer B+ Trees?',
      followUp: 'What makes B+ Trees superior for range queries like BETWEEN 10 AND 50?',
      model: 'B+ Trees store all actual record keys in leaf nodes connected by a linked list, leaving internal nodes for navigation only. This maximizes branching factor, lowers tree height, and enables sequential leaf scans for range queries.'
    }
  ],
  'Python': [
    {
      q: 'Explain how memory management and garbage collection work in CPython.',
      followUp: 'What is the purpose of the cyclic garbage collector alongside reference counting?',
      model: 'CPython relies primarily on reference counting. When a reference drops to zero, memory is immediately deallocated. A supplemental cyclic garbage collector periodically detects self-referencing reference cycles.'
    },
    {
      q: 'What is the Python Global Interpreter Lock (GIL) and how does it impact multi-threaded versus multi-process code?',
      followUp: 'In what scenarios does a multi-threaded Python program actually achieve concurrent speedups?',
      model: 'The GIL ensures only one thread executes Python bytecode at any moment, limiting CPU-bound multithreading. Multi-processing bypasses the GIL with separate processes. I/O-bound tasks still benefit from multithreading.'
    }
  ],
  'HR': [
    {
      q: 'Tell me about yourself, your academic background, and what inspired you to pursue software engineering.',
      followUp: 'What is a technical project you are proudest of and what was your individual contribution?',
      model: 'Structure with present, past, future. Highlight academic highlights, hands-on passion, and direct alignment with this role.'
    },
    {
      q: 'Describe a situation where a project deadline was at risk. How did you prioritize and deliver under pressure?',
      followUp: 'What would you do differently if faced with that situation again?',
      model: 'Use the STAR format: Situation, Task, Action, Result. Highlight pragmatic trade-offs, clear team communication, and successful delivery.'
    }
  ],
};

export default function InterviewRoom() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const category = params.get('category') || 'DSA';
  const difficulty = params.get('difficulty') || 'Intermediate';
  const mode = params.get('mode') || 'Strict Technical';
  const seedQuestion = params.get('seedQuestion');

  // Build question set
  const initialQuestions = QUESTION_BANK[category] || QUESTION_BANK['DSA'];
  const questions = seedQuestion
    ? [{ q: seedQuestion, followUp: 'Can you walk me through the trade-offs of that approach?', model: 'Comprehensive discussion of design choices and edge cases.' }, ...initialQuestions]
    : initialQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);

  const currentQ = questions[currentIndex] || questions[0];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate live transcription stream
      setTimeout(() => {
        setAnswer((prev) =>
          prev
            ? `${prev} Additionally, considering time complexity and edge cases...`
            : `In my experience with ${category}, we approach this by first analyzing the fundamental invariants and choosing the optimal data structures.`
        );
      }, 1800);
    }
  };

  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ.q);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2500);
    }
  };

  const handleTriggerFollowUp = () => {
    setShowFollowUp(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(currentQ.followUp));
    }
  };

  const handleNextOrFinish = async () => {
    const recordedAnswer = answer.trim() || 'Candidate provided verbal answer during the session.';
    const scoreVal = Math.floor(Math.random() * 20) + 75; // 75 - 95 score

    const questionResult = {
      id: currentIndex + 1,
      question: currentQ.q,
      candidateAnswer: recordedAnswer,
      score: Number((scoreVal / 10).toFixed(1)),
      feedback: `Good coverage of core ${category} concepts. Strong communication tone.`,
      modelAnswer: currentQ.model,
    };

    const nextResults = [...evaluatedAnswers, questionResult];
    setEvaluatedAnswers(nextResults);
    setAnswer('');
    setShowFollowUp(false);
    setIsRecording(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((c) => c + 1);
    } else {
      // Completed interview! Save to MongoDB and navigate to Report
      const newId = `iv-${Date.now()}`;
      const avgScore = Math.round(
        nextResults.reduce((acc, q) => acc + parseFloat(q.score) * 10, 0) / nextResults.length
      );

      const newReport = {
        id: newId,
        category,
        mode,
        difficulty,
        date: new Date().toISOString().split('T')[0],
        minutes: Math.max(1, Math.round((15 * 60 - timerSeconds) / 60)),
        score: avgScore,
        rubric: {
          technical: avgScore + 2,
          problemSolving: avgScore - 3,
          communication: avgScore + 4,
          confidence: avgScore - 1,
        },
        summary: `Strong technical proficiency demonstrated in ${category}. Answered ${questions.length} questions with solid composure and relevant structural examples.`,
        strengths: [
          `Clear conceptual understanding of ${category} fundamentals`,
          'Logical verbal pacing and deliberate explanation',
          'Identified appropriate asymptotic trade-offs',
        ],
        improvements: [
          'Elaborate more on memory footprint and cache locality',
          'Practice structuring answers around concrete real-world metrics',
        ],
        questions: nextResults,
      };

      try {
        await api.post('/interviews', newReport);
      } catch (err) {
        console.info('Interview save DB notice:', err.message);
      }
      addInterview(newReport);
      navigate(`/report/${newId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Room Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy-900 px-6 py-4 text-white shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-white">
              {category} Interview Room
            </h2>
            <p className="text-xs text-white/60">
              Interviewer: <strong className="text-white">{mode}</strong> · Level: {difficulty}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold">
            <Clock size={15} className="text-signal-soft" />
            <span>Time Remaining: <strong className="font-mono text-white">{formatTimer(timerSeconds)}</strong></span>
          </div>

          <div className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white/80">
            Question <strong className="text-white">{currentIndex + 1}</strong> of {questions.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: AI Interviewer & Question Prompt */}
        <div className="space-y-6 lg:col-span-2">
          {/* Question Display Card */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-signal-soft px-2.5 py-1 text-xs font-bold text-signal-deep">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs text-ink-soft">Single Response Required</span>
              </div>
              <button
                type="button"
                onClick={handleSpeakQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1 text-xs font-semibold text-ink hover:bg-paper"
              >
                <Volume2 size={14} className={isSpeaking ? 'text-signal animate-pulse' : 'text-ink-soft'} />
                {isSpeaking ? 'Speaking...' : 'Listen'}
              </button>
            </div>

            <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
              "{currentQ.q}"
            </h3>

            {/* Follow-up question if prompted */}
            {showFollowUp && (
              <div className="mt-5 rounded-xl border border-signal/20 bg-signal-soft/40 p-4">
                <div className="flex items-center gap-2 text-signal-deep">
                  <Sparkles size={16} />
                  <span className="font-display text-xs font-bold uppercase tracking-wider">
                    Interviewer Follow-up
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">
                  "{currentQ.followUp}"
                </p>
              </div>
            )}
          </div>

          {/* Answer Input Section */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="font-display text-sm font-bold text-ink">Your Response</span>
              <div className="flex rounded-lg bg-paper p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    inputMode === 'text' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
                  }`}
                >
                  Text Response
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    inputMode === 'voice' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
                  }`}
                >
                  Voice Recording
                </button>
              </div>
            </div>

            {/* Voice Mode */}
            {inputMode === 'voice' && (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-paper/60 p-8 text-center">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 ${
                    isRecording ? 'bg-rose text-white animate-pulse' : 'bg-signal text-white'
                  }`}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                <p className="mt-4 font-display text-base font-bold text-ink">
                  {isRecording ? 'Listening... Speak your answer now' : 'Click microphone to start speaking'}
                </p>
                <p className="mt-1 max-w-sm text-xs text-ink-soft">
                  Speech-to-text converts your answer automatically. You can review and edit below before submitting.
                </p>
              </div>
            )}

            {/* Text Mode or Transcript Editor */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-ink-soft">
                {inputMode === 'voice' ? 'Real-time Transcript (Editable):' : 'Type your detailed answer:'}
              </label>
              <textarea
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Structure your answer with key concepts, trade-offs, and examples..."
                className="mt-1.5 w-full rounded-xl border border-line bg-paper p-4 text-sm text-ink placeholder:text-ink-faint focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Press Submit to proceed to next question</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={handleTriggerFollowUp}
                disabled={showFollowUp}
                className="btn-outline text-xs"
              >
                <Sparkles size={14} className="text-signal" />
                {showFollowUp ? 'Follow-up Active' : 'Request Follow-up Question'}
              </button>

              <button
                type="button"
                onClick={handleNextOrFinish}
                className="btn-primary text-xs"
              >
                {currentIndex + 1 < questions.length ? (
                  <>Submit & Next Question <ArrowRight size={14} /></>
                ) : (
                  <>Finish & Generate Report <CheckCircle size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Interviewer Persona Card & Tips */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel text-center">
            <div className="relative mx-auto h-24 w-24">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-navy-900 text-2xl font-bold text-white shadow-lg">
                AI
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-signal text-white">
                  <Volume2 size={13} className="animate-spin" />
                </span>
              )}
            </div>

            <h4 className="mt-4 font-display text-base font-bold text-ink">{mode} Evaluator</h4>
            <p className="mt-1 text-xs text-ink-soft">
              Active Session · Evaluating Technical Rigor & Articulation
            </p>

            <div className="mt-5 rounded-xl bg-paper p-3 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-soft">Tone:</span>
                <span className="font-semibold text-ink">{mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Questions:</span>
                <span className="font-semibold text-ink">{currentIndex + 1} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Rubric:</span>
                <span className="font-semibold text-ink">4 Metrics Evaluated</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-saffron/30 bg-saffron-soft/40 p-4 text-xs text-saffron">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle size={15} /> Strategy Tip
            </p>
            <p className="mt-1 text-ink-soft leading-relaxed">
              Answer the question directly in the first 2 sentences before diving into complex theoretical nuances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
