import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const user = localStorage.getItem('user');
      const isDemo = user ? JSON.parse(user)?.isDemo : false;
      if (!isDemo) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

export const transactionsApi = {
  getAll: (filters?: any) => api.get('/transactions', { params: filters }).then(r => r.data),
  create: (data: any) => api.post('/transactions', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getStats: (period = 'month') => api.get('/transactions/stats', { params: { period } }).then(r => r.data),
  getChart: (period = 'month') => api.get('/transactions/chart', { params: { period } }).then(r => r.data),
  exportCsvUrl: (filters?: any) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    // For demo mode — return null (we'll build client-side CSV)
    return token ? `${base}/transactions/export/csv?${params.toString()}` : null;
  },
};

export const categoriesApi = {
  getAll: () => api.get('/categories').then(r => r.data),
  create: (data: any) => api.post('/categories', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const budgetApi = {
  getAll: () => api.get('/budgets').then(r => r.data),
  getStatus: () => api.get('/budgets/status').then(r => r.data),
  create: (data: any) => api.post('/budgets', data).then(r => r.data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
  register: (data: any) =>
    api.post('/auth/register', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  updateProfile: (data: any) => api.put('/auth/profile', data).then(r => r.data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }).then(r => r.data),
  /** Generate a 15-min Telegram link token (dashboard → copy → paste into bot) */
  generateLinkToken: () =>
    api.post('/auth/telegram-link-token').then(r => r.data),
  /** Remove Telegram link from current account */
  unlinkTelegram: () =>
    api.post('/auth/telegram-unlink').then(r => r.data),
};
