import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  FastForward,
  FileText,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { api } from '../lib/api';

function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function makeSubmissionId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readAuthToken() {
  try {
    const raw = localStorage.getItem('interviewiq_auth_session');
    return raw ? JSON.parse(raw)?.token || '' : '';
  } catch {
    return '';
  }
}

function pickSupportedAudioMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported?.(c)) || '';
}

function AiInterviewerAvatar({ status, name }) {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`absolute h-48 w-48 rounded-full transition-all duration-500 sm:h-56 sm:w-56 ${
          isSpeaking
            ? 'animate-ping bg-signal/20'
            : isListening
              ? 'animate-pulse bg-jade/20'
              : isThinking
                ? 'animate-spin bg-gradient-to-tr from-amber-500/25 via-signal/15 to-transparent'
                : 'bg-signal/10'
        }`}
        style={{ animationDuration: isThinking ? '3s' : '2s' }}
      />
      <div
        className={`relative flex h-40 w-40 items-center justify-center rounded-full border-2 shadow-2xl transition-colors duration-300 sm:h-48 sm:w-48 ${
          isSpeaking
            ? 'border-signal bg-navy-900/90 shadow-signal/30'
            : isListening
              ? 'border-jade bg-navy-900/90 shadow-jade/30'
              : isThinking
                ? 'border-amber-400 bg-navy-900/90 shadow-amber-500/25'
                : 'border-line bg-navy-900/90'
        }`}
      >
        <svg viewBox="0 0 120 120" className="h-28 w-28 sm:h-32 sm:w-32" aria-label={name}>
          <defs>
            <linearGradient id="iqAvatarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="42" r="21" fill="url(#iqAvatarGrad)" opacity="0.92" />
          <path d="M24 102 C24 79 40 68 60 68 C80 68 96 79 96 102" fill="url(#iqAvatarGrad)" opacity="0.88" />
          <path d="M36 44 C36 27 84 27 84 44" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <rect x="33" y="40" width="5" height="12" rx="2.5" fill="#e2e8f0" />
          <rect x="82" y="40" width="5" height="12" rx="2.5" fill="#e2e8f0" />
          <path d="M84 50 Q80 60 66 59" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialFromNav = location.state?.initialSession;
  const hasMatchingInitial = Boolean(
    sessionId && initialFromNav && (initialFromNav.id === sessionId || initialFromNav._id === sessionId)
  );

  const [session, setSession] = useState(() => (hasMatchingInitial ? initialFromNav : null));
  const [loadingSession, setLoadingSession] = useState(!hasMatchingInitial);
  const [bootError, setBootError] = useState('');
  const [actionError, setActionError] = useState('');
  const [endError, setEndError] = useState('');
  const [lastEndReason, setLastEndReason] = useState('candidate_ended');

  // Voice & auto-turn state machine: waiting_speech | listening | transcribing | thinking
  const [turnPhase, setTurnPhase] = useState('waiting_speech');
  const [thinkingStage, setThinkingStage] = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState(null); // 5 -> 4 -> 3 -> 2 -> 1 -> 0
  const [micEnabled, setMicEnabled] = useState(true);
  const [micPermissionNeeded, setMicPermissionNeeded] = useState(false);
  const [micLevels, setMicLevels] = useState(() => Array(14).fill(12));
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [latestAck, setLatestAck] = useState('');
  const [speechDetected, setSpeechDetected] = useState(false);

  const [ending, setEnding] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    hasMatchingInitial ? Number(initialFromNav.remainingSeconds ?? initialFromNav.durationMinutes * 60) : 0
  );

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiConn, setAiConn] = useState({ reachable: true, label: 'Connected · Local AI' });

  const bootStartedRef = useRef(false);
  const autoEndedRef = useRef(false);
  const lastQuestionHandledRef = useRef('');
  const endingRef = useRef(false);
  const micEnabledRef = useRef(true);
  const turnPhaseRef = useRef('waiting_speech');

  // Persistent mic hardware refs (kept open across the entire interview)
  const mediaStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const vadRafRef = useRef(null);
  const speakTimeoutRef = useRef(null);
  const transcribeAbortRef = useRef(null);
  const discardOnStopRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const listenStartedAtRef = useRef(0);
  const noiseFloorRef = useRef(0.012);
  const lastCountdownValRef = useRef(null);

  useEffect(() => {
    endingRef.current = ending;
  }, [ending]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  useEffect(() => {
    turnPhaseRef.current = turnPhase;
  }, [turnPhase]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      teardownPersistentMic();
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (transcribeAbortRef.current) transcribeAbortRef.current.abort();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function checkStatus() {
      try {
        const res = await api.get('/interview/ai-status');
        if (!active) return;
        const whisperReady = Boolean(res?.whisper?.available);
        setAiConn({
          reachable: Boolean(res?.reachable),
          label: `${res?.llm?.model || 'Local AI'} · ${whisperReady ? 'Whisper Offline STT' : 'STT Loading'}`,
        });
      } catch {
        if (active) setAiConn({ reachable: false, label: 'AI Service Offline' });
      }
    }
    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadOrStartSession() {
      if (sessionId) {
        if (hasMatchingInitial) {
          setLoadingSession(false);
          return;
        }
        setLoadingSession(true);
        setBootError('');
        try {
          const remote = await api.get(`/interview/${encodeURIComponent(sessionId)}`);
          if (!active) return;
          if (remote.status === 'completed' || remote.status === 'expired') {
            navigate(`/interview/report/${encodeURIComponent(remote.id || sessionId)}`, { replace: true });
            return;
          }
          setSession(remote);
          setRemainingSeconds(Number(remote.remainingSeconds ?? remote.durationMinutes * 60));
        } catch (err) {
          if (!active) return;
          setBootError(err.message || 'Unable to load interview session.');
        } finally {
          if (active) setLoadingSession(false);
        }
        return;
      }

      if (bootStartedRef.current) return;
      bootStartedRef.current = true;
      setLoadingSession(true);
      setBootError('');
      try {
        const category = searchParams.get('category') || 'Technical Interview';
        const difficulty = searchParams.get('difficulty') || 'Intermediate';
        const mode = searchParams.get('mode') || 'Strict Technical Interviewer';
        const jobRole = searchParams.get('jobRole') || 'Software Engineer';
        const durationMinutes = Number(searchParams.get('durationMinutes')) || 20;
        const resumeId = searchParams.get('resumeId') || undefined;
        const seedQuestion = searchParams.get('seedQuestion') || undefined;

        const res = await api.post('/interview/start', {
          jobRole,
          category,
          difficulty,
          mode,
          durationMinutes,
          resumeId,
          seedQuestion,
        });
        if (!active) return;
        if (!res?.session?.id) {
          throw new Error('Server did not return a valid interview session.');
        }
        setSession(res.session);
        setRemainingSeconds(Number(res.session.remainingSeconds ?? durationMinutes * 60));
        navigate(`/interview/room/${encodeURIComponent(res.session.id)}`, {
          replace: true,
          state: { initialSession: res.session },
        });
      } catch (err) {
        if (!active) return;
        setBootError(err.message || 'Unable to start live AI interview session.');
      } finally {
        if (active) setLoadingSession(false);
      }
    }

    loadOrStartSession();
    return () => {
      active = false;
    };
  }, [sessionId, hasMatchingInitial, navigate, searchParams]);

  useEffect(() => {
    if (!session || session.status !== 'active') return undefined;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;
    if (remainingSeconds === 0 && !autoEndedRef.current && !ending) {
      autoEndedRef.current = true;
      handleEndInterview('time_expired');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, session?.status]);

  useEffect(() => {
    if (turnPhase !== 'thinking') {
      setThinkingStage('');
      return undefined;
    }
    setThinkingStage('Evaluating spoken answer...');
    const t1 = setTimeout(() => setThinkingStage('AI thinking...'), 1600);
    const t2 = setTimeout(() => setThinkingStage('Preparing next question...'), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [turnPhase]);

  function stopRecorderOnly(discard = false) {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    discardOnStopRef.current = discard;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  }

  function teardownPersistentMic() {
    stopRecorderOnly(true);
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setMicLevels(Array(14).fill(12));
  }

  async function ensurePersistentMic() {
    if (mediaStreamRef.current && mediaStreamRef.current.active) {
      setMicPermissionNeeded(false);
      return mediaStreamRef.current;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setActionError('Microphone recording is unavailable in this browser. Open InterviewIQ in Chrome or Edge.');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicPermissionNeeded(false);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
      return stream;
    } catch (err) {
      setMicPermissionNeeded(true);
      setActionError(
        err?.name === 'NotAllowedError'
          ? 'Microphone access is required for hands-free voice answers. Click "Enable Microphone" below.'
          : err?.message || 'Unable to access microphone.'
      );
      return null;
    }
  }

  async function beginListeningTurn() {
    if (endingRef.current || !micEnabledRef.current) return;
    if (turnPhaseRef.current === 'listening' || turnPhaseRef.current === 'transcribing' || turnPhaseRef.current === 'thinking') {
      return;
    }

    const stream = await ensurePersistentMic();
    if (!stream || endingRef.current) return;

    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    const mimeType = pickSupportedAudioMime();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    audioChunksRef.current = [];
    discardOnStopRef.current = false;
    hasSpokenRef.current = false;
    setSpeechDetected(false);
    setSilenceCountdown(null);
    lastCountdownValRef.current = null;
    noiseFloorRef.current = 0.012;
    const now = Date.now();
    listenStartedAtRef.current = now;
    lastVoiceAtRef.current = now;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        audioChunksRef.current.push(ev.data);
      }
    };

    recorder.onstop = async () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (vadRafRef.current) {
        cancelAnimationFrame(vadRafRef.current);
        vadRafRef.current = null;
      }
      setMicLevels(Array(14).fill(12));
      setSilenceCountdown(null);

      const chunks = [...audioChunksRef.current];
      const chosenMime = recorder.mimeType || mimeType || 'audio/webm';
      const shouldDiscard = discardOnStopRef.current || endingRef.current;
      const spokeAudio = hasSpokenRef.current;

      if (shouldDiscard) return;

      const blob = new Blob(chunks, { type: chosenMime });
      await processRecordedTurn(blob, chosenMime, spokeAudio);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
    setRecordingSeconds(0);
    setTurnPhase('listening');
    turnPhaseRef.current = 'listening';

    recordTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    // Real-time Web Audio VAD + 5-to-0 auto-countdown loop
    const analyser = analyserRef.current;
    if (analyser) {
      const timeData = new Uint8Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      const monitorAudio = () => {
        if (turnPhaseRef.current !== 'listening' || endingRef.current) return;

        analyser.getByteTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i += 1) {
          const norm = (timeData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeData.length);

        // Adaptive ambient noise calibration during quiet gaps
        if (rms < noiseFloorRef.current) {
          noiseFloorRef.current = noiseFloorRef.current * 0.9 + rms * 0.1;
        } else if (!hasSpokenRef.current && Date.now() - listenStartedAtRef.current < 450) {
          noiseFloorRef.current = Math.min(0.04, noiseFloorRef.current * 0.8 + rms * 0.2);
        }

        const speechThreshold = Math.max(0.025, noiseFloorRef.current * 2.2);
        const ts = Date.now();

        if (rms > speechThreshold) {
          hasSpokenRef.current = true;
          setSpeechDetected(true);
          lastVoiceAtRef.current = ts;
          if (lastCountdownValRef.current !== null) {
            lastCountdownValRef.current = null;
            setSilenceCountdown(null);
          }
        } else {
          // Wait 1.0s of silence before counting down 5 -> 4 -> 3 -> 2 -> 1 -> 0
          const refTime = hasSpokenRef.current ? lastVoiceAtRef.current : listenStartedAtRef.current;
          const silentMs = ts - refTime;
          if (silentMs >= 1000) {
            const elapsedAfterGrace = silentMs - 1000;
            const remaining = Math.max(0, 5 - Math.floor(elapsedAfterGrace / 1000));
            if (lastCountdownValRef.current !== remaining) {
              lastCountdownValRef.current = remaining;
              setSilenceCountdown(remaining);
            }
            if (elapsedAfterGrace >= 5000) {
              stopRecorderOnly(false);
              return;
            }
          }
        }

        analyser.getByteFrequencyData(freqData);
        const bars = Array.from({ length: 14 }, (_, idx) => {
          const v = freqData[idx % freqData.length] || 0;
          return Math.max(12, Math.min(100, Math.round((v / 255) * 100)));
        });
        setMicLevels(bars);

        vadRafRef.current = requestAnimationFrame(monitorAudio);
      };

      vadRafRef.current = requestAnimationFrame(monitorAudio);
    }
  }

  async function processRecordedTurn(blob, mimeType, spokeAudio) {
    setActionError('');

    let answerText = '';
    if (spokeAudio && blob && blob.size >= 512) {
      setTurnPhase('transcribing');
      turnPhaseRef.current = 'transcribing';

      const ext = mimeType.includes('ogg')
        ? 'ogg'
        : mimeType.includes('mp4')
          ? 'm4a'
          : mimeType.includes('wav')
            ? 'wav'
            : 'webm';
      const form = new FormData();
      form.append('file', blob, `spoken_answer.${ext}`);

      const token = readAuthToken();
      const controller = new AbortController();
      transcribeAbortRef.current = controller;

      try {
        const resp = await fetch('/api/interview/transcribe', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
          signal: controller.signal,
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && String(data.transcript || '').trim()) {
          answerText = String(data.transcript).trim();
        } else if (resp.status !== 422) {
          throw new Error(data.message || `Transcription error (${resp.status}).`);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setActionError(err.message || 'Voice transcription failed. Retrying microphone listening...');
        setTurnPhase('waiting_speech');
        if (micEnabledRef.current) {
          setTimeout(() => beginListeningTurn(), 600);
        }
        return;
      } finally {
        transcribeAbortRef.current = null;
      }
    }

    if (!answerText) {
      answerText = 'Candidate remained silent during the 5-second response countdown.';
    }

    await submitAnswerToAI(answerText);
  }

  async function submitAnswerToAI(answerText) {
    if (!session || endingRef.current) return;
    setTurnPhase('thinking');
    turnPhaseRef.current = 'thinking';
    setActionError('');

    try {
      const res = await api.post('/interview/answer', {
        sessionId: session.id,
        answer: answerText,
        submissionId: makeSubmissionId(),
      });

      if (res.latestTurn?.conversational_response) {
        setLatestAck(res.latestTurn.conversational_response);
      }

      if (res.session) {
        setSession(res.session);
        if (typeof res.session.remainingSeconds === 'number') {
          setRemainingSeconds(res.session.remainingSeconds);
        }
      }

      if (res.interviewComplete || res.expired || res.session?.status === 'completed' || res.session?.status === 'expired') {
        const targetId = res.reportId || res.session?.id || session.id;
        if (res.session?.status !== 'active' && targetId) {
          teardownPersistentMic();
          navigate(`/interview/report/${encodeURIComponent(targetId)}`, { replace: true });
          return;
        }
        setEndError('Interview completed, but report persistence could not be confirmed. Click Retry Report Generation.');
      }
    } catch (err) {
      setActionError(err.message || 'AI evaluation failed. Re-enabling microphone so you can continue.');
      setTurnPhase('waiting_speech');
      if (micEnabledRef.current) {
        setTimeout(() => beginListeningTurn(), 800);
      }
    }
  }

  function finishTurnNow() {
    if (turnPhase === 'listening') {
      stopRecorderOnly(false);
    }
  }

  function skipSpeechAndListen() {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    beginListeningTurn();
  }

  // Whenever a new active question arrives: speak it first (mic gated), THEN open mic automatically
  useEffect(() => {
    if (!session || session.status !== 'active' || ending) return undefined;
    const qText = String(session.currentQuestion || '').trim();
    if (!qText || lastQuestionHandledRef.current === qText) return undefined;
    lastQuestionHandledRef.current = qText;

    // Gate mic cleanly while interviewer starts speaking the question
    stopRecorderOnly(true);
    setTurnPhase('waiting_speech');
    turnPhaseRef.current = 'waiting_speech';
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

    if (!ttsEnabled || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      const t = setTimeout(() => beginListeningTurn(), 250);
      return () => clearTimeout(t);
    }

    const spokenFull = latestAck ? `${latestAck} ${qText}` : qText;
    let completed = false;
    const onSpeechDone = () => {
      if (completed) return;
      completed = true;
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      setIsSpeaking(false);
      if (!endingRef.current && micEnabledRef.current) {
        beginListeningTurn();
      }
    };

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenFull);
      utterance.rate = 1.02;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = onSpeechDone;
      utterance.onerror = onSpeechDone;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);

      // Browser safety fallback if SpeechSynthesis omits onend
      const estMs = Math.max(4500, Math.min(24000, spokenFull.split(/\s+/).length * 520 + 1800));
      speakTimeoutRef.current = setTimeout(onSpeechDone, estMs);
    } catch {
      onSpeechDone();
    }

    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentQuestion, session?.status]);

  async function toggleMicActive() {
    if (micEnabled) {
      setMicEnabled(false);
      micEnabledRef.current = false;
      stopRecorderOnly(true);
      setTurnPhase('waiting_speech');
    } else {
      setMicEnabled(true);
      micEnabledRef.current = true;
      if (!isSpeaking && turnPhase === 'waiting_speech') {
        await beginListeningTurn();
      }
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore if blocked
    }
  }

  async function handleEndInterview(reason = 'candidate_ended') {
    if (!session || ending) return;
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    teardownPersistentMic();

    setEnding(true);
    setActionError('');
    setEndError('');
    setLastEndReason(reason);

    try {
      const res = await api.post('/interview/end', {
        sessionId: session.id,
        reason,
      });
      const persistedId = res?.reportId || res?.report?.id;
      if (!res?.success || !persistedId || res?.report?.status === 'active') {
        throw new Error('Backend did not confirm that the final evaluation report was saved.');
      }
      navigate(`/interview/report/${encodeURIComponent(persistedId)}`, { replace: true });
    } catch (err) {
      autoEndedRef.current = false;
      setEndError(err.message || 'Failed to generate and save the final evaluation report.');
      setEnding(false);
    }
  }

  const answeredCount = session?.questions?.length || 0;
  const maxQuestions = session?.maxQuestions || 8;
  const progressPct = useMemo(
    () => Math.min(100, Math.round(((answeredCount + 1) / Math.max(1, maxQuestions)) * 100)),
    [answeredCount, maxQuestions]
  );

  const aiAvatarStatus =
    turnPhase === 'thinking' || turnPhase === 'transcribing' || ending
      ? 'thinking'
      : isSpeaking
        ? 'speaking'
        : turnPhase === 'listening'
          ? 'listening'
          : 'idle';

  const aiStatusLabel =
    ending
      ? 'Finalizing Report...'
      : turnPhase === 'transcribing'
        ? 'Transcribing Speech...'
        : turnPhase === 'thinking'
          ? thinkingStage || 'Thinking...'
          : isSpeaking
            ? 'Speaking Question — Please Listen'
            : turnPhase === 'listening'
              ? speechDetected
                ? 'Listening — Speak Freely'
                : 'Mic Active — Listening...'
              : 'Mic Paused';

  const timerTone =
    remainingSeconds <= 30
      ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
      : remainingSeconds <= 120
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
        : 'border-line bg-surface text-ink';

  if (loadingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-paper px-4 text-ink">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-10 text-center shadow-panel">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-signal" />
          <h2 className="mt-5 font-display text-xl font-bold">Entering AI Interview Room</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Connecting to your local AI interviewer and preparing your opening question...
          </p>
        </div>
      </div>
    );
  }

  if (bootError || !session) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-paper px-4 text-ink">
        <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-panel">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 font-display text-xl font-bold">Interview Session Unavailable</h2>
          <p className="mt-2 text-sm text-rose-500">{bootError || 'Session could not be initialized.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/interview"
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-signal"
            >
              Back to Interview Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-paper text-ink">
      {/* Top Full-Screen Bar */}
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-3 py-1 text-xs font-semibold text-signal">
              <Sparkles className="h-3.5 w-3.5" />
              InterviewIQ Voice Room
            </span>
            <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink">
              {session.jobRole || 'Software Engineer'}
            </span>
            <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink-soft">
              {session.category}
            </span>
            <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold capitalize text-ink">
              {session.currentDifficulty || session.difficulty}
            </span>
            {session.resumeFileName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-jade/15 px-3 py-1 text-xs font-medium text-jade">
                <FileText className="h-3.5 w-3.5" />
                {session.resumeFileName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold ${timerTone}`}>
              <Clock className="h-4 w-4" />
              {formatClock(remainingSeconds)}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                  if (micEnabledRef.current) beginListeningTurn();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4 text-signal" /> : <VolumeX className="h-4 w-4 text-ink-mute" />}
              {ttsEnabled ? 'Audio On' : 'Muted'}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Windowed' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-7xl">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-ink-soft">
            <span>
              Question {Math.min(answeredCount + 1, maxQuestions)} of {maxQuestions}
            </span>
            <span>{progressPct}% progress</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-signal transition-all duration-300"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Split Interview Stage */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-6 sm:px-8">
        {endError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Final Evaluation Report Failed</p>
                <p className="text-xs text-ink-soft">{endError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleEndInterview(lastEndReason)}
              disabled={ending}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {ending ? 'Retrying...' : 'Retry Report Generation'}
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <div className="flex items-center gap-2">
              {micPermissionNeeded && (
                <button
                  type="button"
                  onClick={() => beginListeningTurn()}
                  className="rounded-lg bg-signal px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Enable Microphone
                </button>
              )}
              <button type="button" onClick={() => setActionError('')} className="text-xs font-semibold underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          {/* LEFT SIDE: AI Interviewer Avatar, Status & Always-On Mic Activity */}
          <section className="flex flex-col items-center justify-between rounded-2xl border border-line bg-surface p-8 text-center shadow-panel lg:col-span-5">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold ${
                aiAvatarStatus === 'speaking'
                  ? 'bg-signal/15 text-signal'
                  : aiAvatarStatus === 'listening'
                    ? 'bg-jade/15 text-jade'
                    : aiAvatarStatus === 'thinking'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'border border-line bg-paper text-ink-soft'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              {aiStatusLabel}
            </span>

            <div className="my-8">
              <AiInterviewerAvatar
                status={aiAvatarStatus}
                name={session.interviewerName || 'AI Interviewer'}
              />
            </div>

            <div className="w-full space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {session.interviewerName || 'Vikram'}
                </h2>
                <p className="text-xs font-medium text-ink-soft">{session.mode}</p>
              </div>

              <div className="rounded-xl border border-line bg-paper px-4 py-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-ink-soft">
                  <span>Live Microphone</span>
                  <span className={turnPhase === 'listening' ? 'font-semibold text-jade' : 'text-ink-mute'}>
                    {turnPhase === 'listening'
                      ? `Always On · ${formatClock(recordingSeconds)}`
                      : isSpeaking
                        ? 'Gated while AI speaks'
                        : 'Processing'}
                  </span>
                </div>
                <div className="flex h-8 items-end justify-center gap-1.5">
                  {micLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className={`w-2 rounded-full transition-all duration-100 ${
                        turnPhase === 'listening' ? 'bg-jade' : 'bg-line'
                      }`}
                      style={{ height: `${lvl}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: Question Projection Only (No answer input box, No text box, No History) */}
          <section className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-panel lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-signal/15 px-3 py-1 font-bold text-signal">
                  Question {Math.min(answeredCount + 1, maxQuestions)} / {maxQuestions}
                </span>
                {session.currentTopic && (
                  <span className="rounded-lg border border-line bg-paper px-3 py-1 font-medium text-ink-soft">
                    {session.currentTopic}
                  </span>
                )}
              </div>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={skipSpeechAndListen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-signal/30 bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal hover:bg-signal/20"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Answer Now
                </button>
              )}
            </div>

            {/* Clean Question Projection */}
            <div className="my-auto py-8">
              {latestAck && (
                <p className="mb-4 text-sm italic text-ink-soft">
                  "{latestAck}"
                </p>
              )}
              <h1 className="font-display text-2xl font-semibold leading-relaxed text-ink sm:text-3xl lg:text-[32px]">
                {session.currentQuestion || 'Preparing your next question...'}
              </h1>
            </div>

            {/* Minimal Auto-Advance Status Line */}
            <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs">
              {isSpeaking ? (
                <span className="inline-flex items-center gap-2 font-medium text-signal">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  Interviewer is asking the question — your mic opens automatically right after.
                </span>
              ) : turnPhase === 'transcribing' ? (
                <span className="inline-flex items-center gap-2 font-medium text-signal">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing your spoken answer locally...
                </span>
              ) : turnPhase === 'thinking' ? (
                <span className="inline-flex items-center gap-2 font-medium text-amber-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {thinkingStage || 'Preparing next question...'}
                </span>
              ) : turnPhase === 'listening' ? (
                silenceCountdown !== null ? (
                  <span className="inline-flex items-center gap-2.5 font-semibold text-amber-400">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 font-mono text-sm font-bold text-amber-400">
                      {silenceCountdown}
                    </span>
                    Silence detected — moving to next question in {silenceCountdown}... (speak to cancel)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 font-medium text-jade">
                    <Mic className="h-4 w-4 animate-pulse" />
                    Listening — speak your answer naturally. Auto-advances 5s after you stop speaking.
                  </span>
                )
              ) : micPermissionNeeded ? (
                <button
                  type="button"
                  onClick={() => beginListeningTurn()}
                  className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 font-semibold text-white"
                >
                  <Mic className="h-4 w-4" />
                  Enable Microphone to Answer
                </button>
              ) : (
                <span className="text-ink-soft">Microphone paused.</span>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Control Area */}
      <footer className="border-t border-line bg-surface px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-medium ${aiConn.reachable ? 'text-jade' : 'text-rose-500'}`}>
              {aiConn.reachable ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {aiConn.label}
            </span>
            <span className="text-ink-soft">
              Mic:{' '}
              <strong className="text-ink">
                {!micEnabled
                  ? 'Paused'
                  : isSpeaking
                    ? 'Waiting for AI'
                    : turnPhase === 'listening'
                      ? silenceCountdown !== null
                        ? `Countdown ${silenceCountdown}s`
                        : 'Always On (Listening)'
                      : 'Processing'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {turnPhase === 'listening' && (
              <button
                type="button"
                onClick={finishTurnNow}
                className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <FastForward className="h-3.5 w-3.5" />
                Next Question
              </button>
            )}

            <button
              type="button"
              onClick={toggleMicActive}
              disabled={ending || turnPhase === 'thinking' || turnPhase === 'transcribing'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              {micEnabled ? <Mic className="h-3.5 w-3.5 text-jade" /> : <MicOff className="h-3.5 w-3.5 text-rose-500" />}
              {micEnabled ? 'Mic Always On' : 'Resume Mic'}
            </button>

            <button
              type="button"
              onClick={() => handleEndInterview('candidate_ended')}
              disabled={ending || turnPhase === 'thinking' || turnPhase === 'transcribing'}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              {ending ? 'Generating & Saving Report...' : 'End Interview'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
