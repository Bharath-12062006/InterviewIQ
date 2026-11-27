// Single source of truth for InterviewIQ interview options (aligned with backend & AI service)

export const JOB_ROLES = [
  'Python Developer',
  'Java Developer',
  'MERN Stack Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer',
  'AI/ML Engineer',
  'Data Analyst',
];

export const INTERVIEW_CATEGORIES = [
  'Technical Interview',
  'Coding Interview',
  'Data Structures and Algorithms',
  'Python',
  'Java',
  'C Programming',
  'OOP',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'SQL',
  'HR Interview',
];

export const CATEGORY_PHASES = [
  {
    phase: 'Core Rounds',
    label: 'General & Coding Interviews',
    summary: 'Comprehensive technical screens, problem-solving, and programming languages.',
    items: [
      'Technical Interview',
      'Coding Interview',
      'Data Structures and Algorithms',
      'Python',
      'Java',
      'C Programming',
      'OOP',
    ],
  },
  {
    phase: 'CS Fundamentals',
    label: 'Systems, Databases & HR',
    summary: 'Core computer science subjects and behavioral placement rounds.',
    items: ['DBMS', 'Operating Systems', 'Computer Networks', 'SQL', 'HR Interview'],
  },
];

export const CATEGORIES = INTERVIEW_CATEGORIES;
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export const MODES = [
  'Friendly Interviewer',
  'Strict Technical Interviewer',
  'Senior Software Engineer',
  'HR Interviewer',
];
export const INTERVIEW_DURATIONS = [
  { value: 10, label: '10 minutes', hint: 'Up to 5 questions' },
  { value: 20, label: '20 minutes', hint: 'Up to 8 questions' },
  { value: 30, label: '30 minutes', hint: 'Up to 12 questions' },
];
