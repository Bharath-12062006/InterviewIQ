// Single source of truth for interview options. The backend (Phase 2+)
// will validate against the same lists.
export const CATEGORY_PHASES = [
  {
    phase: 'Phase 1',
    label: 'Languages and fundamentals',
    summary: 'The first topics most campus screens and technical rounds cover.',
    items: ['Python', 'Java', 'C', 'DSA', 'MERN Stack', 'Full Stack', 'SQL', 'DBMS', 'OOPs', 'HR'],
  },
  {
    phase: 'Phase 2',
    label: 'Core subjects',
    summary: 'Theory subjects that follow language fundamentals in a technical round.',
    items: ['Operating Systems', 'Computer Networks', 'Aptitude', 'Software Engineering'],
  },
  {
    phase: 'Phase 3',
    label: 'Advanced rounds',
    summary: 'Later interviews: design, applied skills, and behavioural questions.',
    items: ['System Design', 'Machine Learning', 'Cloud', 'Behavioral'],
  },
];

export const CATEGORIES = CATEGORY_PHASES.flatMap((group) => group.items);
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export const MODES = ['Friendly', 'Strict Technical', 'HR', 'Senior Engineer'];
