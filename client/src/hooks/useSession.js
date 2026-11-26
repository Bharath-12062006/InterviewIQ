import { useAuth } from '../context/AuthContext';
import { initialUserProfile, mockDashboard } from '../data/mock';

// Session hook backed by AuthContext and localStorage
export default function useSession() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();

  return {
    user: user || initialUserProfile,
    notifications: mockDashboard.notifications,
    refreshUser,
    logout,
    isAuthenticated,
  };
}

export function initials(name) {
  if (!name) return 'U';
  return name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}
