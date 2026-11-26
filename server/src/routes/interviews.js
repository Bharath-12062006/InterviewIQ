import express from 'express';
import { Interview } from '../models/Interview.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/interviews
// @desc    Get all interview records for authenticated user with optional filtering
router.get('/', protect, async (req, res) => {
  try {
    const { category, mode } = req.query;
    const filter = { userId: req.user._id };
    if (category && category !== 'All') filter.category = category;
    if (mode && mode !== 'All') filter.mode = mode;

    const interviews = await Interview.find(filter).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get single interview evaluation report
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview report not found.' });
    }
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/interviews
// @desc    Save new completed interview session & scores
router.post('/', protect, async (req, res) => {
  try {
    const {
      category, mode, difficulty, date, minutes,
      score, rubric, summary, strengths, improvements, questions, id
    } = req.body;

    const interviewId = id || `iv-${Date.now().toString().slice(-4)}`;

    const newInterview = await Interview.create({
      userId: req.user._id,
      id: interviewId,
      category,
      mode,
      difficulty: difficulty || 'Intermediate',
      date: date || new Date().toISOString().split('T')[0],
      minutes: minutes || 25,
      score: score || 75,
      rubric: rubric || { technical: 75, problemSolving: 75, communication: 75, confidence: 75 },
      summary: summary || `Completed ${category} interview session.`,
      strengths: strengths || [],
      improvements: improvements || [],
      questions: questions || [],
    });

    res.status(201).json({ success: true, interview: newInterview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete an interview record
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
