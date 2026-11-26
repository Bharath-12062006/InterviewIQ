import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mockDashboard } from '../data/mock';

// Connects to Express + MongoDB backend (/api/dashboard) with graceful fallback
async function fetchDashboard() {
  try {
    const data = await api.get('/dashboard');
    if (data && data.user) return data;
    return mockDashboard;
  } catch (err) {
    console.info('Using local dashboard state while backend connects:', err.message);
    return mockDashboard;
  }
}

export default function useDashboardData() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchDashboard();
      setState({ data, loading: false, error: null });
    } catch {
      setState({ data: null, loading: false, error: 'We could not load your dashboard.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
