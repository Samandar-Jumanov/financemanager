import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

export interface User {
  id: string; username: string; email?: string; fullName?: string;
  company?: string; plan: string; role: string; createdAt?: string; isDemo?: boolean; telegramId?: string;
}
export interface RegisterData { username: string; password: string; email?: string; fullName?: string; company?: string; }

interface AuthCtxType {
  user: User | null; loading: boolean; isDemo: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthCtxType | null>(null);

export const DEMO_USER: User = {
  id: 'demo', username: 'demo', email: 'demo@financebot.uz',
  fullName: 'Demo Foydalanuvchi', company: 'Namuna Savdo LLC',
  plan: 'pro', role: 'admin',
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), isDemo: true,
};

// Credentials that always activate demo mode without hitting the server
const DEMO_CREDENTIALS = [
  { username: 'admin', password: 'admin123' },
  { username: 'demo',  password: 'demo' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Only verify real (non-demo) sessions with the server
        if (!parsed.isDemo) {
          const token = localStorage.getItem('token');
          if (token) {
            authApi.getMe()
              .then(f => { setUser(f); localStorage.setItem('user', JSON.stringify(f)); })
              .catch(() => {});
          }
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const loginAsDemo = () => {
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
  };

  const login = async (username: string, password: string) => {
    // admin/admin123 (or demo/demo) → always go to demo, no server call
    const isMatchingDemo = DEMO_CREDENTIALS.some(
      c => c.username === username.trim() && c.password === password
    );
    if (isMatchingDemo) {
      loginAsDemo();
      return;
    }
    // Real login
    const res = await authApi.login(username, password);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {
    const res = await authApi.register(data);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    if (user?.isDemo) return; // nothing to refresh for demo
    try {
      const f = await authApi.getMe();
      setUser(f); localStorage.setItem('user', JSON.stringify(f));
    } catch {}
  };

  return (
    <AuthCtx.Provider value={{ user, loading, isDemo: user?.isDemo === true, login, register, loginAsDemo, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
