import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Backend origin without trailing slash. Set VITE_API_URL in `.env` (see `.env.example`).
 * If unset, requests use same-origin `/api` (typical when the app and API share one domain).
 */
const API_URL = String(import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
});

function isAuthRoute(url) {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0];
  if (path.includes('/auth/login') || path.includes('/auth/register')) return true;
  if (path.includes('/auth/forgot-password') || path.includes('/auth/reset-password')) return true;
  if (path.includes('/orders/guest')) return true;
  if (path.includes('create-payment-intent-guest')) return true;
  if (path.includes('sync-payment-guest')) return true;
  if (path.includes('payment-failed-guest')) return true;
  if (path.includes('invoice-guest')) return true;
  return false;
}

api.interceptors.request.use((config) => {
  const path = config.url || '';
  const token = localStorage.getItem('token');
  if (token && !isAuthRoute(path)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const path = err.config?.url || '';

    if (status === 401 && !isAuthRoute(path) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      toast.info('Your session expired. Please sign in again.', {
        position: 'top-center',
        autoClose: 4000,
      });
    }

    return Promise.reject(err);
  }
);

/** Shared toast options for forms and API feedback */
export const toastOpts = {
  position: 'top-center',
  autoClose: 3200,
};

/** User-facing message from a failed axios request */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Cannot reach server. Check your connection and that the API is running.';
  }
  const status = err.response?.status;
  const msg = err.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (status === 403) return 'You do not have permission for this action.';
  if (status === 413) return 'Upload too large.';
  if (status === 429) {
    return err.response?.data?.message || 'Too many requests. Please wait and try again.';
  }
  if (status === 503) return err.response?.data?.message || 'Service temporarily unavailable.';
  return fallback;
}

export const authStorage = {
  setSession(token, user) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  },
  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  },
  getUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export default api;
