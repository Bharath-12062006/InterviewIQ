import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  saveUserProfile,
  clearUserProfile,
  initialUserProfile,
  getRegisteredUsers,
  saveRegisteredUsers,
} from '../data/mock';
import { api } from '../lib/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'interviewiq_auth_session';

function hasValidStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.token && parsed.email);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidStoredSession);
  const [user, setUser] = useState(() => (hasValidStoredSession() ? getUserProfile() : initialUserProfile));

  const refreshUser = useCallback(() => {
    setUser(getUserProfile());
  }, []);

  // Hydrate authenticated user from MongoDB on startup when a backend JWT exists
  useEffect(() => {
    let active = true;
    const syncSession = async () => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.token || parsed.token.startsWith('local-token-')) return;

        const res = await api.get('/auth/me');
        if (active && res?.user) {
          const merged = { ...initialUserProfile, ...res.user };
          saveUserProfile(merged);
          setUser(merged);
        }
      } catch (err) {
        if (active && err?.status === 401) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          clearUserProfile();
          setUser(initialUserProfile);
          setIsAuthenticated(false);
        }
      }
    };

    syncSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthEvent = () => {
      const valid = hasValidStoredSession();
      setIsAuthenticated(valid);
      setUser(valid ? getUserProfile() : initialUserProfile);
    };

    window.addEventListener('storage', handleAuthEvent);
    window.addEventListener('auth-changed', handleAuthEvent);
    window.addEventListener('profile-updated', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleAuthEvent);
      window.removeEventListener('auth-changed', handleAuthEvent);
      window.removeEventListener('profile-updated', handleAuthEvent);
    };
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    // Try authenticating with backend & MongoDB first
    try {
      const response = await api.post('/auth/login', { email: normalizedEmail, password });
      if (response && response.token) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: response.token, email: normalizedEmail }),
        );
        if (response.user) {
          const mergedProfile = { ...initialUserProfile, ...response.user };
          saveUserProfile(mergedProfile);
          setUser(mergedProfile);
        }
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('auth-changed'));
        return { success: true };
      }
    } catch (apiErr) {
      // If backend explicitly rejected credentials (4xx), do not fall back
      if (apiErr.status && apiErr.status >= 400 && apiErr.status < 500) {
        return { success: false, error: apiErr.message || 'Invalid email or password.' };
      }
      console.info('Backend unavailable, verifying against registered local accounts:', apiErr.message);
    }

    // Offline / degraded fallback: strictly require a registered account in localStorage
    const registered = getRegisteredUsers();
    const matched = registered.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!matched || matched.password !== password) {
      return {
        success: false,
        error: 'Invalid email or password. Please sign up first if you do not have an account.',
      };
    }

    const { password: _removed, ...safeProfile } = matched;
    const mergedProfile = { ...initialUserProfile, ...safeProfile };
    saveUserProfile(mergedProfile);
    setUser(mergedProfile);

    const sessionToken = `local-token-${Date.now()}`;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: sessionToken, email: normalizedEmail }),
    );

    setIsAuthenticated(true);
    window.dispatchEvent(new Event('auth-changed'));
    return { success: true };
  };

  const signup = async ({ name, email, password, targetRole, university }) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || !password) {
      return { success: false, error: 'Please fill in all required fields.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Try registering with backend & MongoDB
    try {
      const response = await api.post('/auth/signup', {
        name: name.trim(),
        email: normalizedEmail,
        password,
        targetRole,
        university,
      });
      if (response && response.token) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: response.token, email: normalizedEmail }),
        );
        const mergedProfile = { ...initialUserProfile, ...(response.user || { name: name.trim(), email: normalizedEmail, targetRole, university }) };
        saveUserProfile(mergedProfile);
        setUser(mergedProfile);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('profile-updated'));
        window.dispatchEvent(new Event('auth-changed'));
        return { success: true };
      }
    } catch (apiErr) {
      if (apiErr.status && apiErr.status >= 400 && apiErr.status < 500) {
        return { success: false, error: apiErr.message || 'Unable to create account.' };
      }
      console.info('Backend unavailable, saving account locally:', apiErr.message);
    }

    // Offline / degraded fallback: register in localStorage (reject duplicate email)
    const registered = getRegisteredUsers();
    if (registered.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'An account already exists with this email address.' };
    }

    const newProfile = {
      ...initialUserProfile,
      name: name.trim(),
      email: normalizedEmail,
      targetRole: targetRole || 'Software Engineer',
      university: university || '',
      title: 'Candidate / Student',
    };

    saveRegisteredUsers([...registered, { ...newProfile, password }]);
    saveUserProfile(newProfile);
    setUser(newProfile);

    const sessionToken = `local-token-${Date.now()}`;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: sessionToken, email: normalizedEmail }),
    );

    setIsAuthenticated(true);
    window.dispatchEvent(new Event('profile-updated'));
    window.dispatchEvent(new Event('auth-changed'));
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    clearUserProfile();
    setUser(initialUserProfile);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-changed'));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
