import express from 'express';
import { Interview } from '../models/Interview.js';
import { StudyPlan } from '../models/StudyPlan.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get authenticated candidate's dashboard metrics, trend, and recent interviews
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    const interviews = await Interview.find({
      userId: user._id,
      status: { $ne: 'active' },
    }).sort({ createdAt: -1 }).limit(10);
    const studyPlan = await StudyPlan.findOne({ userId: user._id });

    const avgScore = interviews.length > 0
      ? Math.round(interviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / interviews.length)
      : 0;

    const dashboardPayload = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        title: user.title,
        targetRole: user.targetRole,
        university: user.university,
      },
      stats: {
        interviews: { value: interviews.length, delta: interviews.length > 0 ? 'Recorded sessions' : 'Start your first' },
        averageScore: { value: avgScore, delta: interviews.length > 0 ? 'Across sessions' : 'No scores yet' },
        codingSolved: { value: 0, delta: 'Ready to practice' },
        streakDays: { value: interviews.length > 0 ? 1 : 0, delta: 'Keep practicing daily' },
      },
      readiness: {
        score: studyPlan?.readinessScore ?? avgScore,
        basedOn: interviews.length,
      },
      scoreHistory: interviews
        .slice()
        .reverse()
        .map((iv) => ({ label: iv.date, score: iv.score })),
      skills: (user.skills || []).slice(0, 6).map((name) => ({ name, score: avgScore || 50 })),
      topics: [],
      recentInterviews: interviews.map((iv) => ({
        id: iv.id,
        category: iv.category,
        mode: iv.mode,
        difficulty: iv.difficulty,
        date: iv.date,
        score: iv.score,
        minutes: iv.minutes,
      })),
      notifications: [],
    };

    res.json(dashboardPayload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
