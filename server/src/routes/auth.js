import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'interviewiq_jwt_secret_campus_placement_2026', {
    expiresIn: '30d',
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    title: user.title,
    targetRole: user.targetRole,
    university: user.university,
    degree: user.degree,
    gradYear: user.gradYear,
    cgpa: user.cgpa,
    location: user.location,
    bio: user.bio,
    targetCompanies: user.targetCompanies || [],
    skills: user.skills || [],
    github: user.github,
    linkedin: user.linkedin,
    portfolio: user.portfolio,
  };
}

// @route   POST /api/auth/signup
// @desc    Register a new student candidate
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, targetRole, university } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      targetRole: targetRole || 'Software Engineer',
      university: university || '',
      title: 'Candidate / Student',
    });

    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate candidate & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current student session
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

export default router;
