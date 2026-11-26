import express from 'express';
import { User } from '../models/User.js';
import { Interview } from '../models/Interview.js';
import { Resume } from '../models/Resume.js';
import { StudyPlan } from '../models/StudyPlan.js';
import { Settings } from '../models/Settings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/profile
// @desc    Get authenticated candidate profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/profile
// @desc    Update authenticated candidate profile in MongoDB
router.put('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email address cannot be empty.' });
      }
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ message: 'Another account already uses this email address.' });
        }
        user.email = normalizedEmail;
      }
    }

    const fields = [
      'name', 'phone', 'location', 'bio', 'university',
      'degree', 'gradYear', 'cgpa', 'title', 'targetRole',
      'targetCompanies', 'skills', 'github', 'linkedin', 'portfolio',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();
    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    res.json({ success: true, profile: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/profile
// @desc    Delete authenticated candidate account and associated data
router.delete('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      Interview.deleteMany({ userId }),
      Resume.deleteMany({ userId }),
      StudyPlan.deleteMany({ userId }),
      Settings.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);
    res.json({ success: true, message: 'Account and all associated records deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
