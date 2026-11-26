import express from 'express';
import { Resume } from '../models/Resume.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/resume
// @desc    Get parsed resume analysis for authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!resume) {
      return res.status(404).json({ message: 'No resume analysis found' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resume
// @desc    Upload / save parsed resume analysis
router.post('/', protect, async (req, res) => {
  try {
    const { fileName, fileSize, atsScore, targetRole, summary, extracted, missingSkills, suggestedQuestions } = req.body;

    const resume = await Resume.create({
      userId: req.user._id,
      fileName,
      fileSize,
      atsScore: atsScore || 85,
      targetRole: targetRole || 'Software Engineer',
      summary: summary || 'Resume scanned and verified for campus placements.',
      extracted: extracted || {},
      missingSkills: missingSkills || [],
      suggestedQuestions: suggestedQuestions || [],
    });

    res.status(201).json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
