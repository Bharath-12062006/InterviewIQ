import express from 'express';
import { StudyPlan } from '../models/StudyPlan.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_SCHEDULE = [
  { day: 'Monday', title: 'DBMS: Transactions & Isolation Levels', category: 'DBMS', duration: 30, completed: false, questions: 4 },
  { day: 'Tuesday', title: 'DSA: Tree Traversals & Binary Search Trees', category: 'DSA', duration: 45, completed: false, questions: 5 },
  { day: 'Wednesday', title: 'System Design: Rate Limiters & Caching', category: 'System Design', duration: 40, completed: false, questions: 3 },
  { day: 'Thursday', title: 'Mock Interview: Full Stack & Node.js', category: 'Full Stack', duration: 35, completed: false, questions: 6 },
  { day: 'Friday', title: 'SQL: Window Functions & Recursive CTEs', category: 'SQL', duration: 30, completed: false, questions: 4 },
  { day: 'Saturday', title: 'Coding Sprint: Dynamic Programming Patterns', category: 'DSA', duration: 60, completed: false, questions: 3 },
  { day: 'Sunday', title: 'Behavioral & Leadership Principles (STAR)', category: 'HR', duration: 25, completed: false, questions: 5 },
];

const DEFAULT_PRIORITY_DOMAINS = [
  { name: 'DBMS', currentScore: 52, targetScore: 80, gap: '-28%', recommendedActions: 'Practice concurrency and recovery protocols' },
  { name: 'DSA', currentScore: 61, targetScore: 85, gap: '-24%', recommendedActions: 'Focus on graphs and dynamic programming memoization' },
  { name: 'Java', currentScore: 68, targetScore: 80, gap: '-12%', recommendedActions: 'Review multithreading and JVM memory model' },
];

// @route   GET /api/study-plan
// @desc    Get study plan & schedule for authenticated user
router.get('/', protect, async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user._id });
    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user._id,
        weeklySchedule: DEFAULT_SCHEDULE,
        priorityDomains: DEFAULT_PRIORITY_DOMAINS,
      });
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/study-plan
// @desc    Update study plan weekly schedule for authenticated user
router.put('/', protect, async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user._id });
    if (!plan) {
      plan = new StudyPlan({
        userId: req.user._id,
        weeklySchedule: req.body.weeklySchedule || DEFAULT_SCHEDULE,
        priorityDomains: req.body.priorityDomains || DEFAULT_PRIORITY_DOMAINS,
      });
    } else {
      const fields = [
        'weeklySchedule',
        'readinessScore',
        'placementCountdownDays',
        'dailyGoalMinutes',
        'dailyCompletedMinutes',
        'priorityDomains',
      ];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          plan[field] = req.body[field];
        }
      });
    }

    const saved = await plan.save();
    res.json({ success: true, plan: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
