import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    extractionMethod: {
      type: String,
      default: 'pdf-text',
    },
    pageCount: {
      type: Number,
      default: null,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    uploadDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    scoreBand: {
      type: String,
      default: '',
    },
    scoringVersion: {
      type: String,
      default: 'ats-heuristic-v1',
    },
    scoringWeights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    disclaimer: {
      type: String,
      default: '',
    },
    targetRole: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      default: '',
    },
    jobAnalysis: {
      title: String,
      requiredSkills: [String],
      preferredSkills: [String],
      skillsByCategory: mongoose.Schema.Types.Mixed,
      educationRequirements: [String],
      experienceRequirements: [String],
      keywords: Array,
      hasDetailedJD: Boolean,
    },
    summary: {
      type: String,
      default: '',
    },
    contact: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
    },
    extracted: {
      summary: String,
      education: Array,
      experience: Array,
      projects: Array,
      certifications: [String],
      skills: [String],
      otherSkills: [String],
      skillGroups: mongoose.Schema.Types.Mixed,
      sectionsFound: [String],
    },
    components: {
      type: Array,
      default: [],
    },
    skillMatch: {
      matched: Array,
      partial: Array,
      missing: Array,
      requiredTotal: Number,
      requiredCovered: Number,
      requiredStrong: Number,
      preferredTotal: Number,
    },
    keywords: {
      matched: Array,
      missing: Array,
      matchedCount: Number,
      missingCount: Number,
      coverage: Number,
      semanticSimilarity: Number,
      total: Number,
    },
    relevantExperience: {
      type: Array,
      default: [],
    },
    relevantProjects: {
      type: Array,
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingSkills: [
      {
        skill: String,
        importance: String,
        reason: String,
        status: String,
      },
    ],
    recommendations: [
      {
        title: String,
        detail: String,
        priority: String,
      },
    ],
    projectSuggestions: [
      {
        title: String,
        detail: String,
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
