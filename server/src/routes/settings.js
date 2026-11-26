import express from 'express';
import { Settings } from '../models/Settings.js';
import { Interview } from '../models/Interview.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const ALLOWED_SETTINGS_FIELDS = [
  'emailNotifications',
  'dailyPracticeReminder',
  'weeklyReportDigest',
  'soundEffects',
  'speechSynthesizerVoice',
  'micDevice',
  'cameraDevice',
  'theme',
  'codeEditorTheme',
  'autoSubmitTestCases',
  'privacyShareStats',
];

// @route   GET /api/settings
// @desc    Get user preferences
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await Settings.create({ userId: req.user._id });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/settings
// @desc    Update user preferences
router.put('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    ALLOWED_SETTINGS_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    const saved = await settings.save();
    res.json({ success: true, settings: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/settings/change-password
// @desc    Verify current password and update to new password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { current, next } = req.body;
    if (!current || !next) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(current);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }

    user.password = next;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/settings/reset-history
// @desc    Reset interviews in MongoDB for current user
router.post('/reset-history', protect, async (req, res) => {
  try {
    await Interview.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'Interview records reset.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
