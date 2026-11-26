// Client API service for InterviewIQ communicating with Express & MongoDB backend

const API_BASE = '/api';

function getAuthHeader() {
  try {
    const raw = localStorage.getItem('interviewiq_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    }
  } catch {}
  return {};
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && !isFormData && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
