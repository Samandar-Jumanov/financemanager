import ChartLogo from '../components/ChartLogo';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login, loginAsDemo } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Login va parolni kiriting');
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      nav('/dashboard');
    } catch {
      setError("Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginAsDemo();
    nav('/dashboard');
  };

  const wrapStyle = (key: string, hasError = false): React.CSSProperties => ({
    position: 'relative',
    borderRadius: 11,
    border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.5)' : focused === key ? '#6366f1' : '#e5e7f0'}`,
    background: focused === key ? '#fafbff' : '#fff',
    transition: 'all 0.2s',
    boxShadow: focused === key ? '0 0 0 3px rgba(99,102,241,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'transparent',
    border: 'none',
    padding: '13px 14px 13px 40px',
    color: '#1e1f2e',
    fontSize: 14,
    outline: 'none',
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0.35,
    fontSize: 15,
    pointerEvents: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f8ff',
      display: 'flex',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Left decorative panel ── */}
      <div
        className="left-panel"
        style={{
          display: 'none',
          flex: 1,
          position: 'relative',
          background: 'linear-gradient(160deg, #1e1f2e 0%, #252847 100%)',
          overflow: 'hidden',
        }}
      >
        {/* dot-grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
        {/* glow */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          top: '15%', left: '-15%', filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
          bottom: '10%', right: '-5%', filter: 'blur(40px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '64px 56px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.45)' }}>
              <ChartLogo size={20} color="#fff" />
            </div>
            <span style={{ color: '#f9fafb', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>FinanceBot</span>
          </div>

          {/* Hero copy */}
          <div>
            <h2 style={{ color: '#f9fafb', fontSize: 38, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.04em', margin: '0 0 18px' }}>
              Moliyaviy<br />nazorat,<br />bir joyda.
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, maxWidth: 300, margin: 0 }}>
              Daromad va xarajatlaringizni kuzating, byudjet tuzing va moliyaviy erkinlikka erishing.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[{ n: '12k+', l: 'Foydalanuvchi' }, { n: '99.9%', l: 'Ishonchlilik' }, { n: '4.9★', l: 'Reyting' }].map(s => (
              <div key={s.n}>
                <div style={{ color: '#a5b4fc', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.n}</div>
                <div style={{ color: '#4b5563', fontSize: 12, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        background: '#f7f8ff',
      }}>
        {/* top glow */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 320,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '100%', maxWidth: 400,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          position: 'relative', zIndex: 1,
        }}>
          {/* Logo mark */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 8px 24px rgba(99,102,241,0.25)',
            }}>
              <ChartLogo size={24} color="#fff" />
            </div>
            <h1 style={{ color: '#1e1f2e', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 7px' }}>
              Xush kelibsiz
            </h1>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, lineHeight: 1.55 }}>
              Hisobingizga kirish uchun ma'lumotlarni kiriting
            </p>
          </div>

          {/* Demo CTA */}
          <button
            type="button"
            onClick={handleDemo}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'rgba(99,102,241,0.06)',
              border: '1.5px solid rgba(99,102,241,0.18)',
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 22, transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.11)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.38)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.18)';
            }}
          >
            <span style={{ fontSize: 22 }}>🎮</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ color: '#6366f1', fontSize: 13, fontWeight: 600 }}>Demo rejimini ko'ring</div>
              <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 1 }}>Ro'yxatdan o'tmay sinab ko'ring</div>
            </div>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="rgba(99,102,241,0.55)" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: '#eaecf5' }} />
            <span style={{ color: '#c4c9e0', fontSize: 12, fontWeight: 500 }}>yoki kirish</span>
            <div style={{ flex: 1, height: 1, background: '#eaecf5' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>
                USERNAME
              </label>
              <div style={wrapStyle('user', !!error)}>
                <span style={iconStyle}>👤</span>
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus autoComplete="username"
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>PAROL</label>
                <span style={{ color: '#6366f1', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Unutdingizmi?</span>
              </div>
              <div style={wrapStyle('pass', !!error)}>
                <span style={iconStyle}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#c4c9e0', fontSize: 16,
                    padding: 4, lineHeight: 1, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c4c9e0')}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 10, padding: '10px 13px',
                color: '#dc2626', fontSize: 13,
                animation: 'shake 0.3s ease',
              }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: '14px',
                background: loading
                  ? 'rgba(99,102,241,0.45)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 700,
                letterSpacing: '-0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                    style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Kirmoqda...
                </>
              ) : 'Kirish →'}
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: 18, padding: '11px 14px',
            background: '#fff',
            border: '1.5px solid #eaecf5',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ opacity: 0.55, fontSize: 14 }}>💡</span>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>
              Test uchun:{' '}
              <span style={{ color: '#6366f1', fontWeight: 700 }}>admin</span>
              {' / '}
              <span style={{ color: '#6366f1', fontWeight: 700 }}>admin123</span>
            </span>
          </div>

          {/* Footer links */}
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 22 }}>
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>
              Ro'yxatdan o'ting
            </Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 6 }}>
            <Link to="/" style={{ color: '#c4c9e0', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s' }}>
              ← Bosh sahifaga qaytish
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        input::placeholder { color: #c4c9e0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }
        @media (min-width: 860px) {
          .left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}