import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    dailyPracticeReminder: {
      type: Boolean,
      default: true,
    },
    weeklyReportDigest: {
      type: Boolean,
      default: true,
    },
    soundEffects: {
      type: Boolean,
      default: true,
    },
    speechSynthesizerVoice: {
      type: String,
      default: 'Samantha (AI Voice - Warm & Conversational)',
    },
    micDevice: {
      type: String,
      default: 'Built-in Audio Microphone (Default)',
    },
    cameraDevice: {
      type: String,
      default: 'Integrated HD Webcam (1280x720)',
    },
    theme: {
      type: String,
      default: 'light',
    },
    codeEditorTheme: {
      type: String,
      default: 'vs-dark',
    },
    autoSubmitTestCases: {
      type: Boolean,
      default: false,
    },
    privacyShareStats: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
