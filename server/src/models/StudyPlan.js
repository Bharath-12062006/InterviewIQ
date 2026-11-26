import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    placementCountdownDays: {
      type: Number,
      default: 42,
    },
    readinessScore: {
      type: Number,
      default: 68,
    },
    dailyGoalMinutes: {
      type: Number,
      default: 45,
    },
    dailyCompletedMinutes: {
      type: Number,
      default: 25,
    },
    weeklySchedule: [
      {
        day: String,
        title: String,
        category: String,
        duration: Number,
        completed: Boolean,
        questions: Number,
      },
    ],
    priorityDomains: [
      {
        name: String,
        currentScore: Number,
        targetScore: Number,
        gap: String,
        recommendedActions: String,
      },
    ],
  },
  { timestamps: true }
);

export const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
