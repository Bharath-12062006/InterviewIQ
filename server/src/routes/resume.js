import express from 'express';
import multer from 'multer';
import { Resume } from '../models/Resume.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT_RE = /\.(pdf|docx)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_EXT_RE.test(file.originalname || '')) {
      return cb(new Error('Unsupported file type. Please upload a .pdf or .docx resume.'));
    }
    cb(null, true);
  },
});

function handleUploadMiddleware(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Resume file exceeds the 5 MB upload limit.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}

// @route   GET /api/resume
// @desc    Get latest parsed resume ATS report for authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!resume) {
      return res.status(404).json({ message: 'No resume analysis found yet.' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/resume/history
// @desc    List previous ATS resume reports for authenticated user
router.get('/history', protect, async (req, res) => {
  try {
    const items = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('fileName fileSize format extractionMethod uploadDate atsScore scoreBand targetRole createdAt');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/resume/:id
// @desc    Get a specific ATS resume report by ID for authenticated user
router.get('/:id', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume report not found.' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/resume/analyze
// @desc    Upload PDF/DOCX + JD, run real AI extraction & ATS matching, store in MongoDB
router.post('/analyze', protect, handleUploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a PDF or DOCX resume file.' });
    }

    const targetRole = String(req.body.targetRole || '').trim();
    const jobDescription = String(req.body.jobDescription || '').trim();
    const weightsJson = String(req.body.weightsJson || '').trim();

    if (!targetRole && !jobDescription) {
      return res.status(400).json({
        message: 'Please provide a Target Job Title or Job Description for ATS matching.',
      });
    }

    const aiBaseUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const aiServiceKey = (process.env.AI_SERVICE_KEY || '').trim();

    const forwardForm = new FormData();
    const fileBlob = new Blob([req.file.buffer], {
      type: req.file.mimetype || 'application/octet-stream',
    });
    forwardForm.append('file', fileBlob, req.file.originalname);
    forwardForm.append('targetRole', targetRole);
    forwardForm.append('jobDescription', jobDescription);
    if (weightsJson) {
      forwardForm.append('weightsJson', weightsJson);
    }

    const headers = {};
    if (aiServiceKey) {
      headers['x-internal-key'] = aiServiceKey;
    }

    let aiResponse;
    try {
      aiResponse = await fetch(`${aiBaseUrl}/ats/analyze`, {
        method: 'POST',
        headers,
        body: forwardForm,
      });
    } catch (networkErr) {
      console.error('AI service connection failed:', networkErr.message);
      return res.status(503).json({
        message:
          'ATS analysis AI service is currently unreachable. Ensure the Python AI service is running on port 8000.',
      });
    }

    const aiPayload = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({
        message: aiPayload.detail || aiPayload.message || 'ATS analysis failed.',
      });
    }

    const savedResume = await Resume.create({
      userId: req.user._id,
      ...aiPayload,
      uploadDate: new Date().toISOString().split('T')[0],
    });

    res.status(201).json({ success: true, resume: savedResume });
  } catch (err) {
    console.error('Resume analyze error:', err);
    res.status(500).json({ message: err.message || 'Failed to analyze resume.' });
  }
});

// @route   DELETE /api/resume/:id
// @desc    Delete a saved ATS resume report
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: 'Resume report not found.' });
    }
    res.json({ success: true, message: 'Resume report deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
