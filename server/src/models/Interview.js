import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: Number,
  question: { type: String, required: true },
  candidateAnswer: String,
  score: Number,
  feedback: String,
  modelAnswer: String,
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    id: {
      type: String,
      required: true,
      unique: true,
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
    date: {
      type: String,
      required: true,
    },
    minutes: {
      type: Number,
      default: 25,
    },
    score: {
      type: Number,
      required: true,
    },
    rubric: {
      technical: Number,
      problemSolving: Number,
      communication: Number,
      confidence: Number,
    },
    summary: String,
    strengths: [String],
    improvements: [String],
    questions: [questionSchema],
  },
  { timestamps: true }
);

export const Interview = mongoose.model('Interview', interviewSchema);
