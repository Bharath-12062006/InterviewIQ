import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { removeLegacyDemoAccount } from './seed.js';
import { ensureAiServiceRunning, stopManagedAiService } from './services/aiServiceManager.js';

// Route imports
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import profileRoutes from './routes/profile.js';
import interviewRoutes from './routes/interviews.js';
import resumeRoutes from './routes/resume.js';
import studyPlanRoutes from './routes/studyPlan.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB and ensure legacy demo account is removed
connectDB().then(async (connected) => {
  if (connected) {
    try {
      await removeLegacyDemoAccount();
    } catch (err) {
      console.warn('Startup cleanup note:', err.message);
    }
  }
});

// Health & Diagnostic Check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.json({
    status: 'healthy',
    uptime: `${process.uptime().toFixed(1)}s`,
    database: {
      type: 'MongoDB',
      status: states[dbState] || 'Unknown',
      connected: dbState === 1,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none',
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'InterviewIQ Backend API & MongoDB Service',
    docs: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found on InterviewIQ API server.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 InterviewIQ Server running on http://localhost:${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
  ensureAiServiceRunning().catch((err) => {
    console.warn('AI service startup note:', err.message);
  });
});

process.on('SIGINT', () => {
  stopManagedAiService();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopManagedAiService();
  process.exit(0);
});
