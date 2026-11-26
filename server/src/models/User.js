import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 4,
    },
    title: {
      type: String,
      default: 'Candidate / Student',
    },
    university: {
      type: String,
      default: '',
    },
    degree: {
      type: String,
      default: '',
    },
    gradYear: {
      type: String,
      default: '',
    },
    cgpa: {
      type: String,
      default: '',
    },
    targetRole: {
      type: String,
      default: 'Software Engineer',
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    github: {
      type: String,
      default: '',
    },
    linkedin: {
      type: String,
      default: '',
    },
    portfolio: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
