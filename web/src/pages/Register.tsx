import ChartLogo from "../components/ChartLogo";
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../auth';
import { useNavigate, Link } from 'react-router-dom';


const getPasswordStrength = (p: string) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  return s;
};

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', password: '', confirm: '', email: '', fullName: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const set = (k: string) => (e: any) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const strength = getPasswordStrength(form.password);
  const strengthLabel = ['', 'Zaif', "O'rta", 'Yaxshi', 'Kuchli'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#10b981'][strength];

  const nextStep = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) return setError('Username kiriting');
    if (form.username.length < 3) return setError("Username kamida 3 ta belgi bo'lishi kerak");
    if (!form.password) return setError('Parol kiriting');
    if (form.password.length < 6) return setError("Parol kamida 6 ta belgi bo'lishi kerak");
    if (form.password !== form.confirm) return setError('Parollar mos emas');
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        fullName: form.fullName || undefined,
        company: form.company || undefined,
      });
      nav('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const wrapStyle = (key: string): React.CSSProperties => ({
    position: 'relative',
    borderRadius: 11,
    border: `1.5px solid ${focused === key ? '#6366f1' : '#e5e7f0'}`,
    background: focused === key ? '#fafbff' : '#fff',
    transition: 'all 0.2s',
    boxShadow: focused === key ? '0 0 0 3px rgba(99,102,241,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
  });

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'transparent', border: 'none',
    padding: '13px 14px 13px 40px',
    color: '#1e1f2e', fontSize: 14, outline: 'none',
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: 13, top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0.35, fontSize: 15, pointerEvents: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#6b7280', fontSize: 12,
    fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em',
  };

  const eyeBtn: React.CSSProperties = {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', color: '#c4c9e0',
    fontSize: 16, padding: 4, lineHeight: 1, transition: 'color 0.15s',
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
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
          bottom: '5%', right: '-15%', filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '10%', left: '-5%', filter: 'blur(40px)',
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
              Bepul boshlang,<br />hech qachon<br />to'xtamang.
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, maxWidth: 300, margin: 0 }}>
              Ro'yxatdan o'tish 30 soniya oladi. Kredit karta kerak emas.
            </p>
          </div>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '⚡', text: '30 soniyada tayyor' },
              { icon: '🔒', text: "Ma'lumotlaringiz xavfsiz" },
              { icon: '🎯', text: '14 kun bepul Pro sinov' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {b.icon}
                </div>
                <span style={{ color: '#9ca3af', fontSize: 14 }}>{b.text}</span>
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
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 320,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '100%', maxWidth: 420,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          position: 'relative', zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 8px 24px rgba(99,102,241,0.25)',
            }}>
              <ChartLogo size={24} color="#fff" />
            </div>
            <h1 style={{ color: '#1e1f2e', fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 7px' }}>
              Hisob yarating
            </h1>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
              Bepul boshlang — kredit karta kerak emas
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{
                  height: 3, borderRadius: 99,
                  background: s <= step ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : '#eaecf5',
                  opacity: s < step ? 0.45 : 1,
                  transition: 'all 0.4s',
                }} />
                <div style={{ marginTop: 6 }}>
                  <span style={{ color: s <= step ? '#6366f1' : '#c4c9e0', fontSize: 11, fontWeight: 600 }}>
                    {s === 1 ? 'Kirish' : 'Kompaniya'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <form onSubmit={nextStep} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Username */}
              <div>
                <label style={labelStyle}>USERNAME</label>
                <div style={wrapStyle('username')}>
                  <span style={iconStyle}>👤</span>
                  <input
                    type="text" value={form.username} onChange={set('username')}
                    placeholder="mycompany" autoFocus autoComplete="username"
                    onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                    style={inputBase}
                  />
                </div>
                <p style={{ color: '#c4c9e0', fontSize: 11, margin: '5px 0 0' }}>
                  Kichik harf, raqam va _ belgi
                </p>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>PAROL</label>
                <div style={wrapStyle('password')}>
                  <span style={iconStyle}>🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="Kamida 6 ta belgi"
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    style={{ ...inputBase, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={eyeBtn}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#c4c9e0')}
                  >{showPass ? '🙈' : '👁'}</button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div style={{ marginTop: 9 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: i <= strength ? strengthColor : '#eaecf5',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ color: strengthColor, fontSize: 11, fontWeight: 700 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={labelStyle}>PAROLNI TASDIQLANG</label>
                <div style={wrapStyle('confirm')}>
                  <span style={iconStyle}>
                    {form.confirm && form.confirm === form.password ? '✅' : '🔑'}
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
                    placeholder="Parolni qaytaring"
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                    style={{ ...inputBase, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} style={eyeBtn}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#c4c9e0')}
                  >{showConfirm ? '🙈' : '👁'}</button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 13px', color: '#dc2626', fontSize: 13, animation: 'shake 0.3s ease' }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit"
                style={{ marginTop: 4, padding: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Keyingi qadam →
              </button>
            </form>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Optional notice */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(99,102,241,0.05)', border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 11, marginBottom: 2 }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>
                  Bu qadamni o'tkazib yuborasiz ham bo'ladi — hammasi ixtiyoriy.
                </span>
              </div>

              {/* Full name */}
              <div>
                <label style={labelStyle}>
                  TO'LIQ ISM{' '}
                  <span style={{ color: '#c4c9e0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— ixtiyoriy</span>
                </label>
                <div style={wrapStyle('fullName')}>
                  <span style={iconStyle}>✏️</span>
                  <input
                    type="text" value={form.fullName} onChange={set('fullName')}
                    placeholder="Ali Valiyev" autoFocus
                    onFocus={() => setFocused('fullName')} onBlur={() => setFocused(null)}
                    style={inputBase}
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label style={labelStyle}>
                  KOMPANIYA{' '}
                  <span style={{ color: '#c4c9e0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— ixtiyoriy</span>
                </label>
                <div style={wrapStyle('company')}>
                  <span style={iconStyle}>🏢</span>
                  <input
                    type="text" value={form.company} onChange={set('company')}
                    placeholder="Savdo LLC"
                    onFocus={() => setFocused('company')} onBlur={() => setFocused(null)}
                    style={inputBase}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>
                  EMAIL{' '}
                  <span style={{ color: '#c4c9e0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— ixtiyoriy</span>
                </label>
                <div style={wrapStyle('email')}>
                  <span style={iconStyle}>📧</span>
                  <input
                    type="email" value={form.email} onChange={set('email')}
                    placeholder="ali@company.uz"
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    style={inputBase}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 13px', color: '#dc2626', fontSize: 13, animation: 'shake 0.3s ease' }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ padding: '14px 18px', background: '#fff', border: '1.5px solid #eaecf5', borderRadius: 12, color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#eaecf5'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                >← Orqaga</button>

                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '14px', background: loading ? 'rgba(99,102,241,0.45)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                >
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                      </svg>
                      Yaratilmoqda...
                    </>
                  ) : '🎉 Hisobni yaratish'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 22 }}>
            Hisobingiz bormi?{' '}
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>Kirish</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 6 }}>
            <Link to="/" style={{ color: '#c4c9e0', fontSize: 12, textDecoration: 'none' }}>
              ← Bosh sahifaga qaytish
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        input::placeholder { color: #c4c9e0; }
        textarea::placeholder { color: #c4c9e0; }
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