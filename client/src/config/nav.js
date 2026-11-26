import {
  LayoutDashboard, FileText, Mic, Code2, Brain, LineChart, Target, History, User, Settings,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'Prepare',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/resume', label: 'Resume analyzer', icon: FileText },
      { to: '/interview', label: 'Mock interview', icon: Mic },
      { to: '/coding', label: 'Coding practice', icon: Code2 },
      { to: '/aptitude', label: 'Aptitude practice', icon: Brain },
    ],
  },
  {
    label: 'Progress',
    items: [
      { to: '/analytics', label: 'Performance', icon: LineChart },
      { to: '/recommendations', label: 'Study plan', icon: Target },
      { to: '/history', label: 'Interview history', icon: History },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
