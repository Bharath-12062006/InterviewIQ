import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Interview } from './models/Interview.js';
import { Resume } from './models/Resume.js';
import { StudyPlan } from './models/StudyPlan.js';
import { Settings } from './models/Settings.js';

// Clean up any legacy demo account records so users must sign up or log in with their own credentials.
export async function removeLegacyDemoAccount() {
  const connected = mongoose.connection.readyState === 1 || (await connectDB());
  if (!connected) return;

  try {
    const demoUser = await User.findOne({ email: 'priya.raman@college.edu' });
    if (demoUser) {
      await Promise.all([
        Interview.deleteMany({ userId: demoUser._id }),
        Resume.deleteMany({ userId: demoUser._id }),
        StudyPlan.deleteMany({ userId: demoUser._id }),
        Settings.deleteMany({ userId: demoUser._id }),
        User.deleteOne({ _id: demoUser._id }),
      ]);
      console.log('🧹 Removed legacy demo account (priya.raman@college.edu).');
    }
  } catch (err) {
    console.warn('Cleanup note:', err.message);
  }
}
