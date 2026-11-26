import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    fileName: {
      type: String,
      default: 'Candidate_Resume.pdf',
    },
    fileSize: {
      type: String,
      default: '1.4 MB',
    },
    uploadDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    atsScore: {
      type: Number,
      default: 84,
    },
    targetRole: {
      type: String,
      default: 'Software Engineer',
    },
    summary: String,
    extracted: {
      education: Array,
      experience: Array,
      projects: Array,
      skills: [String],
    },
    missingSkills: [
      {
        skill: String,
        importance: String,
        reason: String,
      },
    ],
    suggestedQuestions: [
      {
        category: String,
        question: String,
      },
    ],
  },
  { timestamps: true }
);

export const Resume = mongoose.model('Resume', resumeSchema);
