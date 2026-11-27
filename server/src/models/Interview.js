import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: Number,
  question: { type: String, required: true },
  candidateAnswer: String,
  topic: String,
  difficulty: String,
  score: Number,
  accuracy: String,
  technical_accuracy: Number,
  conceptual_understanding: Number,
  completeness: Number,
  relevance: Number,
  depth: Number,
  communication_clarity: Number,
  what_was_correct: [String],
  what_was_missing: [String],
  suggested_improvement: String,
  ideal_answer: String,
  feedback: String,
  modelAnswer: String,
  nlp_signals: mongoose.Schema.Types.Mixed,
});

const messageSchema = new mongoose.Schema(
  {
    id: String,
    role: {
      type: String,
      enum: ['interviewer', 'candidate'],
      required: true,
    },
    content: { type: String, required: true },
    question: String,
    topic: String,
    difficulty: String,
    action: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'completed',
    },
    jobRole: {
      type: String,
      default: 'Software Engineer',
    },
    category: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      default: 'Intermediate',
    },
    currentDifficulty: {
      type: String,
      default: 'intermediate',
    },
    durationMinutes: {
      type: Number,
      default: 20,
    },
    maxQuestions: {
      type: Number,
      default: 8,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    date: {
      type: String,
      required: true,
    },
    minutes: {
      type: Number,
      default: 0,
    },
    interviewerName: {
      type: String,
      default: 'AI Interviewer',
    },
    engine: {
      type: String,
      default: 'gemini',
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    resumeFileName: {
      type: String,
      default: '',
    },
    resumeSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    currentQuestion: {
      type: String,
      default: '',
    },
    currentTopic: {
      type: String,
      default: '',
    },
    askedQuestions: {
      type: [String],
      default: [],
    },
    topicsCovered: {
      type: [String],
      default: [],
    },
    conversationSummary: {
      type: String,
      default: '',
    },
    lastSubmissionId: {
      type: String,
      default: '',
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    performanceLevel: {
      type: String,
      default: '',
    },
    rubric: {
      technical: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
    },
    technicalEvaluation: {
      technical_knowledge: { type: Number, default: 0 },
      conceptual_understanding: { type: Number, default: 0 },
      answer_accuracy: { type: Number, default: 0 },
      depth_of_knowledge: { type: Number, default: 0 },
      problem_solving_ability: { type: Number, default: 0 },
    },
    communicationEvaluation: {
      explanation_clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      articulation: { type: Number, default: 0 },
    },
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    incorrectConcepts: { type: [String], default: [] },
    recommendedSubjects: { type: [String], default: [] },
    learningPlan: [
      {
        step: Number,
        topic: String,
        action: String,
        priority: String,
      },
    ],
    questions: [questionSchema],
  },
  { timestamps: true }
);

export const Interview = mongoose.model('Interview', interviewSchema);
