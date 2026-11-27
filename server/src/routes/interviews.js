import express from 'express';
import multer from 'multer';
import { Interview } from '../models/Interview.js';
import { Resume } from '../models/Resume.js';
import { protect } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { ensureAiServiceRunning } from '../services/aiServiceManager.js';

const router = express.Router();
const interviewLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 40 });
const inFlightRequests = new Set();
const inFlightStarts = new Map();
const inFlightFinalizations = new Map();

const AUDIO_EXT_RE = /\.(webm|wav|ogg|mp3|m4a|mp4)$/i;
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okExt = AUDIO_EXT_RE.test(file.originalname || '');
    const okMime = String(file.mimetype || '').toLowerCase().startsWith('audio/') || file.mimetype === 'video/webm';
    if (!okExt && !okMime) {
      return cb(new Error('Unsupported audio format. Please record WebM, WAV, OGG, MP3, or M4A audio.'));
    }
    cb(null, true);
  },
});

function handleAudioUpload(req, res, next) {
  audioUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Audio recording exceeds the 15 MB upload limit.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}

const ALLOWED_DURATIONS = new Set([10, 15, 20, 30]);

function maxQuestionsForDuration(minutes) {
  if (minutes <= 10) return 5;
  if (minutes <= 20) return 8;
  return 12;
}

function buildResumeContext(resumeDoc) {
  if (!resumeDoc) return null;
  const extracted = resumeDoc.extracted || {};
  return {
    candidateName: resumeDoc.contact?.name || '',
    targetRole: resumeDoc.targetRole || '',
    summary: extracted.summary || resumeDoc.summary || '',
    skills: extracted.skills || [],
    missingSkills: (resumeDoc.missingSkills || []).map((m) => m.skill).filter(Boolean),
    projects: (extracted.projects || []).slice(0, 5),
    experience: (extracted.experience || []).slice(0, 4),
    education: (extracted.education || []).slice(0, 3),
  };
}

async function callAiService(endpoint, payload, timeoutMs = 165_000) {
  const aiBaseUrl = await ensureAiServiceRunning();
  const aiServiceKey = (process.env.AI_SERVICE_KEY || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (aiServiceKey) {
    headers['x-internal-key'] = aiServiceKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(`${aiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const error = new Error('AI interviewer timed out while generating a response.');
      error.status = 504;
      throw error;
    }
    const error = new Error(
      'AI interviewer service is unreachable. Ensure the Python AI service is running on port 8000.'
    );
    error.status = 503;
    throw error;
  }
  clearTimeout(timer);

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const detailText = Array.isArray(data.detail)
      ? data.detail.map((item) => item?.msg || JSON.stringify(item)).join('; ')
      : typeof data.detail === 'string'
        ? data.detail
        : '';
    const error = new Error(detailText || data.message || `AI service error (${resp.status}).`);
    error.status = resp.status;
    throw error;
  }
  return data;
}

function computeRemainingSeconds(session) {
  if (!session.expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
}

function serializeSession(sessionDoc) {
  const obj = sessionDoc.toObject ? sessionDoc.toObject() : { ...sessionDoc };
  obj.remainingSeconds = obj.status === 'active' ? computeRemainingSeconds(obj) : 0;
  obj.elapsedSeconds = obj.startedAt
    ? Math.max(0, Math.floor(((obj.endedAt ? new Date(obj.endedAt).getTime() : Date.now()) - new Date(obj.startedAt).getTime()) / 1000))
    : 0;
  return obj;
}

async function finalizeSessionReport(session, user, finalStatus = 'completed') {
  // Never regenerate final report if already completed/expired or already persisted
  if (session.status !== 'active' || session.endedAt) {
    return session;
  }

  const existingPromise = inFlightFinalizations.get(session.id);
  if (existingPromise) {
    return existingPromise;
  }

  const run = (async () => {
    const fresh = await Interview.findOne({ id: session.id, userId: session.userId });
    if (fresh && (fresh.status !== 'active' || fresh.endedAt)) {
      Object.assign(session, fresh.toObject());
      return fresh;
    }

    const elapsedMs = session.startedAt ? Date.now() - new Date(session.startedAt).getTime() : 60_000;
    const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000));

    const aiReport = await callAiService('/interview/final-report', {
    candidateName: user?.name || 'Candidate',
    jobRole: session.jobRole || 'Software Engineer',
    category: session.category,
    difficulty: session.difficulty,
    mode: session.mode,
    durationMinutes: session.durationMinutes || 20,
    elapsedMinutes,
    topicsCovered: session.topicsCovered || [],
    evaluatedQuestions: (session.questions || []).map((q) => ({
      question: q.question,
      candidateAnswer: q.candidateAnswer || '',
      topic: q.topic || session.category,
      difficulty: q.difficulty || session.currentDifficulty,
      score: Number(q.score || 0),
      accuracy: q.accuracy || 'partial',
      technical_accuracy: Number(q.technical_accuracy || 0),
      conceptual_understanding: Number(q.conceptual_understanding || 0),
      completeness: Number(q.completeness || 0),
      relevance: Number(q.relevance || 0),
      depth: Number(q.depth || 0),
      communication_clarity: Number(q.communication_clarity || 0),
      what_was_correct: q.what_was_correct || [],
      what_was_missing: q.what_was_missing || [],
      suggested_improvement: q.suggested_improvement || '',
      ideal_answer: q.ideal_answer || '',
    })),
    resumeContext: session.resumeSnapshot || null,
  });

  const tech = aiReport.technical_evaluation || {};
  const comm = aiReport.communication_evaluation || {};

  session.status = finalStatus;
  session.endedAt = new Date();
  session.minutes = elapsedMinutes;
  session.score = aiReport.overall_score ?? 0;
  session.performanceLevel = aiReport.performance_level || '';
  session.technicalEvaluation = tech;
  session.communicationEvaluation = comm;
  session.rubric = {
    technical: tech.technical_knowledge ?? session.score,
    problemSolving: tech.problem_solving_ability ?? session.score,
    communication: comm.explanation_clarity ?? session.score,
    confidence: comm.articulation ?? session.score,
  };
  session.summary = aiReport.executive_summary || '';
  session.strengths = aiReport.strongest_areas || [];
  session.improvements = aiReport.weakest_areas || [];
  session.missingConcepts = aiReport.missing_concepts || [];
  session.incorrectConcepts = aiReport.incorrect_concepts || [];
  session.recommendedSubjects = aiReport.recommended_subjects || [];
  session.learningPlan = aiReport.learning_plan || [];
  session.currentQuestion = '';

    await session.save();
    return session;
  })();

  inFlightFinalizations.set(session.id, run);
  try {
    return await run;
  } finally {
    inFlightFinalizations.delete(session.id);
  }
}

// @route   GET /api/interview/ai-status
// @desc    Return non-sensitive LLM & local STT readiness for Interview Room connection badge
router.get('/ai-status', protect, async (req, res) => {
  try {
    const aiBaseUrl = await ensureAiServiceRunning();
    const resp = await fetch(`${aiBaseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await resp.json().catch(() => ({}));
    res.json({
      reachable: resp.ok,
      llm: data.llm || null,
      whisper: data.whisper || null,
    });
  } catch (err) {
    res.status(503).json({ reachable: false, message: err.message || 'AI service unavailable.' });
  }
});

// @route   POST /api/interview/transcribe
// @desc    Upload candidate spoken audio blob and transcribe offline via Python faster-whisper
router.post('/transcribe', protect, interviewLimiter, handleAudioUpload, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer?.length) {
      return res.status(400).json({ message: 'No audio recording was received. Please try speaking again.' });
    }

    const aiBaseUrl = await ensureAiServiceRunning();
    const aiServiceKey = (process.env.AI_SERVICE_KEY || '').trim();
    const headers = {};
    if (aiServiceKey) {
      headers['x-internal-key'] = aiServiceKey;
    }

    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    form.append('file', blob, req.file.originalname || 'answer.webm');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50_000);
    let aiResp;
    try {
      aiResp = await fetch(`${aiBaseUrl}/interview/transcribe`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return res.status(504).json({ message: 'Speech transcription timed out. Please try a shorter recording.' });
      }
      return res.status(503).json({
        message: 'Speech transcription service is unreachable. Ensure the Python AI service is running on port 8000.',
      });
    }
    clearTimeout(timer);

    const payload = await aiResp.json().catch(() => ({}));
    if (!aiResp.ok) {
      return res.status(aiResp.status).json({
        message: payload.detail || payload.message || `Transcription failed (${aiResp.status}).`,
      });
    }

    res.json(payload);
  } catch (err) {
    console.error('Interview transcribe error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Failed to transcribe speech.' });
  }
});

// @route   POST /api/interview/start
// @desc    Start a live AI-powered conversational mock interview session
router.post('/start', protect, interviewLimiter, async (req, res) => {
  const startLockKey = `start:${req.user._id}`;
  if (inFlightStarts.has(startLockKey)) {
    try {
      const result = await inFlightStarts.get(startLockKey);
      return res.status(result.statusCode).json(result.body);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || 'Failed to start interview.' });
    }
  }

  const startPromise = (async () => {
    const {
      jobRole = 'Software Engineer',
      category = 'Technical Interview',
      difficulty = 'Intermediate',
      mode = 'Strict Technical Interviewer',
      durationMinutes = 20,
      resumeId = '',
      seedQuestion = '',
      forceNew = false,
    } = req.body;

    const cleanRole = String(jobRole).trim() || 'Software Engineer';
    const cleanCategory = String(category).trim() || 'Technical Interview';
    const cleanDifficulty = String(difficulty).trim() || 'Intermediate';
    const cleanMode = String(mode).trim() || 'Strict Technical Interviewer';
    const cleanSeed = String(seedQuestion || '').trim();

    // Requirement #3: Avoid regenerating Q1 when an identical active session already has a valid question
    if (!forceNew && !cleanSeed) {
      const existingQuery = {
        userId: req.user._id,
        status: 'active',
        jobRole: cleanRole,
        category: cleanCategory,
        difficulty: cleanDifficulty,
        mode: cleanMode,
        expiresAt: { $gt: new Date() },
        currentQuestion: { $exists: true, $ne: '' },
        'questions.0': { $exists: false },
      };
      if (resumeId) {
        existingQuery.resumeId = resumeId;
      } else {
        existingQuery.resumeId = null;
      }
      const reusable = await Interview.findOne(existingQuery).sort({ createdAt: -1 });
      if (reusable) {
        return {
          statusCode: 200,
          body: {
            success: true,
            reusedSession: true,
            session: serializeSession(reusable),
            opening: {
              interviewer_name: reusable.interviewerName,
              first_question: reusable.currentQuestion,
              topic: reusable.currentTopic,
              difficulty: reusable.currentDifficulty,
              engine: reusable.engine,
            },
          },
        };
      }
    }

    const parsedDuration = Number(durationMinutes);
    const validDuration = ALLOWED_DURATIONS.has(parsedDuration) ? parsedDuration : 20;
    const maxQuestions = maxQuestionsForDuration(validDuration);

    let resumeDoc = null;
    if (resumeId) {
      resumeDoc = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resumeDoc) {
        const err = new Error('Selected resume could not be found in your account.');
        err.status = 404;
        throw err;
      }
    }

    const resumeContext = buildResumeContext(resumeDoc);

    const aiStart = await callAiService('/interview/start', {
      candidateName: req.user.name || 'Candidate',
      jobRole: cleanRole,
      category: cleanCategory,
      difficulty: cleanDifficulty,
      mode: cleanMode,
      durationMinutes: validDuration,
      seedQuestion: cleanSeed,
      resumeContext,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validDuration * 60_000);
    const sessionId = `iv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const openingText = `${aiStart.greeting}\n\n${aiStart.first_question}`.trim();

    const session = await Interview.create({
      userId: req.user._id,
      id: sessionId,
      status: 'active',
      jobRole: cleanRole,
      category: cleanCategory,
      mode: cleanMode,
      difficulty: cleanDifficulty,
      currentDifficulty: aiStart.difficulty || 'intermediate',
      durationMinutes: validDuration,
      maxQuestions,
      startedAt: now,
      expiresAt,
      date: now.toISOString().split('T')[0],
      minutes: 0,
      interviewerName: aiStart.interviewer_name || 'AI Interviewer',
      engine: aiStart.engine || 'ollama',
      resumeId: resumeDoc ? resumeDoc._id : null,
      resumeFileName: resumeDoc ? resumeDoc.fileName : '',
      resumeSnapshot: resumeContext,
      currentQuestion: aiStart.first_question,
      currentTopic: aiStart.topic || cleanCategory,
      askedQuestions: [aiStart.first_question],
      topicsCovered: [aiStart.topic || cleanCategory],
      messages: [
        {
          id: `msg-${Date.now()}-0`,
          role: 'interviewer',
          content: openingText,
          question: aiStart.first_question,
          topic: aiStart.topic || cleanCategory,
          difficulty: aiStart.difficulty || 'intermediate',
          action: 'start',
          timestamp: now,
        },
      ],
      questions: [],
    });

    return {
      statusCode: 201,
      body: {
        success: true,
        session: serializeSession(session),
        opening: aiStart,
      },
    };
  })();

  inFlightStarts.set(startLockKey, startPromise);
  try {
    const result = await startPromise;
    res.status(result.statusCode).json(result.body);
  } catch (err) {
    console.error('Interview start error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Failed to start interview.' });
  } finally {
    inFlightStarts.delete(startLockKey);
  }
});

// @route   POST /api/interview/answer
// @desc    Submit candidate answer, evaluate via AI, generate contextual follow-up, persist in MongoDB
router.post('/answer', protect, interviewLimiter, async (req, res) => {
  let acquiredLockKey = null;
  try {
    const { sessionId, answer, submissionId = '' } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const lockKey = `answer:${req.user._id}:${sessionId}`;
    if (inFlightRequests.has(lockKey)) {
      return res.status(409).json({
        message: 'Your previous response is still being evaluated. Please wait before submitting again.',
      });
    }
    inFlightRequests.add(lockKey);
    acquiredLockKey = lockKey;

    const cleanAnswer = String(answer || '').trim();
    if (!cleanAnswer) {
      return res.status(400).json({ message: 'Please provide an answer before submitting.' });
    }

    const session = await Interview.findOne({ id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    // Idempotency: prevent duplicate submission on refresh/retry
    if (submissionId && session.lastSubmissionId === submissionId) {
      return res.json({
        success: true,
        duplicatePrevented: true,
        session: serializeSession(session),
      });
    }

    if (session.status !== 'active') {
      return res.status(409).json({
        message: 'This interview session has already ended.',
        session: serializeSession(session),
      });
    }

    // Server-side duration enforcement
    const remainingSeconds = computeRemainingSeconds(session);
    if (remainingSeconds <= 0) {
      await finalizeSessionReport(session, req.user, 'expired');
      return res.json({
        success: true,
        expired: true,
        interviewComplete: true,
        session: serializeSession(session),
      });
    }

    const conversationHistory = (session.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
      topic: m.topic || '',
      difficulty: m.difficulty || '',
    }));

    const aiTurn = await callAiService('/interview/answer', {
      jobRole: session.jobRole,
      category: session.category,
      difficulty: session.currentDifficulty || session.difficulty,
      mode: session.mode,
      durationMinutes: session.durationMinutes,
      remainingSeconds,
      currentQuestion: session.currentQuestion,
      currentTopic: session.currentTopic || session.category,
      candidateAnswer: cleanAnswer,
      conversationHistory,
      conversationSummary: session.conversationSummary || '',
      askedQuestions: session.askedQuestions || [],
      topicsCovered: session.topicsCovered || [],
      answeredCount: (session.questions || []).length,
      maxQuestions: session.maxQuestions || 8,
      resumeContext: session.resumeSnapshot || null,
    });

    const evalObj = aiTurn.evaluation;
    const questionEntry = {
      id: (session.questions || []).length + 1,
      question: session.currentQuestion,
      candidateAnswer: cleanAnswer,
      topic: session.currentTopic || session.category,
      difficulty: session.currentDifficulty || 'intermediate',
      score: evalObj.score,
      accuracy: evalObj.accuracy,
      technical_accuracy: evalObj.technical_accuracy,
      conceptual_understanding: evalObj.conceptual_understanding,
      completeness: evalObj.completeness,
      relevance: evalObj.relevance,
      depth: evalObj.depth,
      communication_clarity: evalObj.communication_clarity,
      what_was_correct: evalObj.what_was_correct || [],
      what_was_missing: evalObj.what_was_missing || [],
      suggested_improvement: evalObj.suggested_improvement || '',
      ideal_answer: evalObj.ideal_answer || '',
      feedback: evalObj.feedback || '',
      modelAnswer: evalObj.ideal_answer || '',
      nlp_signals: aiTurn.nlp_signals || {},
    };

    session.messages.push({
      id: `msg-${Date.now()}-cand`,
      role: 'candidate',
      content: cleanAnswer,
      topic: session.currentTopic || session.category,
      difficulty: session.currentDifficulty || 'intermediate',
      action: 'answer',
      timestamp: new Date(),
    });

    session.questions.push(questionEntry);
    if (submissionId) {
      session.lastSubmissionId = submissionId;
    }
    if (aiTurn.updated_summary) {
      session.conversationSummary = aiTurn.updated_summary;
    }
    if (aiTurn.next_topic && !session.topicsCovered.includes(aiTurn.next_topic)) {
      session.topicsCovered.push(aiTurn.next_topic);
    }
    session.currentDifficulty = aiTurn.difficulty || session.currentDifficulty;
    session.engine = aiTurn.engine || session.engine;

    const reachedLimit = session.questions.length >= (session.maxQuestions || 8);
    const shouldEnd = Boolean(aiTurn.interview_complete) || reachedLimit || !aiTurn.next_question;

    if (shouldEnd) {
      if (aiTurn.conversational_response) {
        session.messages.push({
          id: `msg-${Date.now()}-end`,
          role: 'interviewer',
          content: aiTurn.conversational_response,
          topic: aiTurn.next_topic || session.currentTopic,
          difficulty: session.currentDifficulty,
          action: 'conclude',
          timestamp: new Date(),
        });
      }
      await finalizeSessionReport(session, req.user, 'completed');
      const serialized = serializeSession(session);
      return res.json({
        success: true,
        interviewComplete: true,
        reportId: serialized.id,
        latestTurn: aiTurn,
        session: serialized,
      });
    }

    const nextDisplay = aiTurn.conversational_response
      ? `${aiTurn.conversational_response}\n\n${aiTurn.next_question}`
      : aiTurn.next_question;

    session.messages.push({
      id: `msg-${Date.now()}-ai`,
      role: 'interviewer',
      content: nextDisplay,
      question: aiTurn.next_question,
      topic: aiTurn.next_topic || session.currentTopic,
      difficulty: session.currentDifficulty,
      action: aiTurn.next_action,
      timestamp: new Date(),
    });

    session.currentQuestion = aiTurn.next_question;
    session.currentTopic = aiTurn.next_topic || session.currentTopic;
    if (!session.askedQuestions.includes(aiTurn.next_question)) {
      session.askedQuestions.push(aiTurn.next_question);
    }

    await session.save();
    res.json({
      success: true,
      interviewComplete: false,
      latestTurn: aiTurn,
      session: serializeSession(session),
    });
  } catch (err) {
    console.error('Interview answer error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Failed to evaluate answer.' });
  } finally {
    if (acquiredLockKey) {
      inFlightRequests.delete(acquiredLockKey);
    }
  }
});

// @route   POST /api/interview/end
// @desc    End an active interview session and generate the final evaluation report
router.post('/end', protect, interviewLimiter, async (req, res) => {
  try {
    const { sessionId, reason = 'completed' } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const session = await Interview.findOne({ id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    if (session.status === 'active') {
      const finalStatus = reason === 'expired' || reason === 'time_expired' ? 'expired' : 'completed';
      await finalizeSessionReport(session, req.user, finalStatus);
    }

    const serialized = serializeSession(session);
    res.json({
      success: true,
      reportId: serialized.id,
      report: serialized,
    });
  } catch (err) {
    console.error('Interview end error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Failed to finalize interview report.' });
  }
});

// @route   GET /api/interview/history  &  GET /api/interviews
// @desc    Get all interview records for authenticated user
router.get('/history', protect, async (req, res) => {
  try {
    const { category, mode, status } = req.query;
    const filter = { userId: req.user._id };
    if (category && category !== 'All') filter.category = category;
    if (mode && mode !== 'All') filter.mode = mode;
    filter.status = status || { $ne: 'active' };

    const interviews = await Interview.find(filter).sort({ createdAt: -1 });
    res.json(interviews.map(serializeSession));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { category, mode } = req.query;
    const filter = { userId: req.user._id, status: { $ne: 'active' } };
    if (category && category !== 'All') filter.category = category;
    if (mode && mode !== 'All') filter.mode = mode;

    const interviews = await Interview.find(filter).sort({ createdAt: -1 });
    res.json(interviews.map(serializeSession));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/interview/active
// @desc    Return latest non-expired active session with a valid question (0 AI calls)
router.get('/active', protect, async (req, res) => {
  try {
    const activeSession = await Interview.findOne({
      userId: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
      currentQuestion: { $exists: true, $ne: '' },
    }).sort({ createdAt: -1 });
    if (!activeSession) {
      return res.json({ session: null });
    }
    res.json({ session: serializeSession(activeSession) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/interview/report/:id
// @desc    Get final interview evaluation report by session ID
router.get('/report/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview report not found.' });
    }
    res.json(serializeSession(interview));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/interview/:id  &  GET /api/interviews/:id
// @desc    Get single interview session or report (supports page-refresh recovery)
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    // Auto-finalize if active session already passed expiration timestamp
    if (interview.status === 'active' && computeRemainingSeconds(interview) <= 0) {
      await finalizeSessionReport(interview, req.user, 'expired');
    }

    res.json(serializeSession(interview));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/interview/:id  &  DELETE /api/interviews/:id
// @desc    Delete an interview record owned by user
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await Interview.findOneAndDelete({ id: req.params.id, userId: req.user._id });
    if (!result) {
      return res.status(404).json({ message: 'Interview record not found.' });
    }
    res.json({ success: true, message: 'Interview record deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
