import ChartLogo from "../components/ChartLogo";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useState, useEffect, useRef } from 'react';

const features = [
  { icon: '🎙', title: 'Ovozli buyruqlar', desc: 'Telegram orqali ovozli xabar yuboring — tranzaksiya avtomatik saqlandi. Yozmasdan ham ishlaydi.' },
  { icon: '📊', title: 'Real-vaqt dashboard', desc: 'Kirim, chiqim va sof foyda har doim ko\'z oldingizda. Kunlik, oylik, yillik tahlil.' },
  { icon: '🤖', title: 'AI tahlil', desc: 'Groq AI yordamida matn va ovoz tahlili. "Bu oy qancha sarfladik?" deb so\'rang — javob darhol.' },
  { icon: '📈', title: 'Kategoriya tahlili', desc: 'Qaysi kategoriyaga ko\'p ketayapti? Pie chart va bar chart bilan aniq ko\'ring.' },
  { icon: '🎯', title: 'Byudjet nazorati', desc: 'Har bir kategoriyaga oylik limit qo\'ying. 80% ga yetganda ogohlantirish keladi.' },
  { icon: '⚡', title: 'Tez qo\'shish', desc: 'Web dashboarddan 3 ta click bilan tranzaksiya qo\'shing. Telegram kutmay ham bo\'ladi.' },
];

const steps = [
  { n: '01', title: 'Ro\'yxatdan o\'ting', desc: 'Kompaniya nomingiz bilan 30 soniyada hisob oching.', emoji: '👤' },
  { n: '02', title: 'Telegram botni ulang', desc: '/start buyrug\'ini yuboring — bot tayyor.', emoji: '🤖' },
  { n: '03', title: 'Tranzaksiya yozing', desc: '"500 ming kirim savdo" yoki ovozli xabar yuboring.', emoji: '✏️' },
  { n: '04', title: 'Dashboard kuzating', desc: 'Barcha ma\'lumotlar real vaqtda dashboardda aks etadi.', emoji: '📊' },
];

const plans = [
  { name: 'Bepul', price: '0', per: 'doim', features: ['50 tranzaksiya/oy', '5 kategoriya', 'Asosiy dashboard', 'Telegram bot'] },
  { name: 'Pro', price: '99 000', per: 'oy', badge: '🔥 Mashhur', features: ['Cheksiz tranzaksiyalar', 'Cheksiz kategoriyalar', 'AI tahlil', 'Byudjet nazorati', 'Ovozli buyruqlar', 'Hisobot eksport'] },
  { name: 'Korporativ', price: 'Muzokarada', per: '', features: ['Pro + hammasi', 'Ko\'p foydalanuvchi', 'API kirish', 'Maxsus integratsiya', 'Dedikatsiyalangan support'] },
];

const testimonials = [
  { name: 'Bobur Toshmatov', role: 'Savdo direktori, Nexus Trade', text: 'Oldin WhatsApp da yozib yurardim. Endi ovozli xabar yuboryapman — dashboard o\'zi to\'ldi. Ajoyib!', avatar: 'BT' },
  { name: 'Malika Yusupova', role: 'Moliya boshqaruvchi, Fresh Market', text: 'Byudjet nazorati xususiyati bizga oyiga 2-3 mln so\'m tejashga yordam berdi.', avatar: 'MY' },
  { name: 'Jasur Karimov', role: 'Asoschi, TechStart UZ', text: 'Startap uchun ideal. Xisob-kitobchi yollashga pul yo\'q edi — FinanceBot hamma narsani qiladi.', avatar: 'JK' },
];


function ContactModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [focused, setFocused] = useState<string | null>(null);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setStatus('sending');
    await new Promise(r => setTimeout(r, 1400));
    setStatus('sent');
  };

  const fieldStyle = (key: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    background: focused === key ? '#fff' : '#f8f9ff',
    border: `1.5px solid ${focused === key ? '#6366f1' : '#e5e7f0'}`,
    borderRadius: 10, padding: '12px 14px',
    color: '#1e1f2e', fontSize: 14, outline: 'none',
    transition: 'all 0.2s',
    boxShadow: focused === key ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(30,31,46,0.4)', backdropFilter: 'blur(8px)', cursor: 'pointer' }} />
      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 22, padding: '36px 32px', width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.08)', animation: 'modalIn 0.25s ease' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#f3f4f8', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 54, marginBottom: 18 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1f2e', margin: '0 0 10px', letterSpacing: '-0.03em' }}>Xabar yuborildi!</h3>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.65, margin: '0 0 28px' }}>Jamoamiz tez orada siz bilan bog'lanadi. Odatda 1 ish kuni ichida javob beramiz.</p>
            <button onClick={onClose} style={{ padding: '12px 28px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Yopish</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                <ChartLogo size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e1f2e', margin: 0, letterSpacing: '-0.03em' }}>Jamoa bilan bog'laning</h3>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Savolingizga tez javob beramiz</p>
              </div>
            </div>
            <div style={{ height: 1, background: '#f0f1f8', margin: '22px 0' }} />
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.04em' }}>ISMINGIZ</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Ali Valiyev" required autoFocus onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} style={fieldStyle('name')} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.04em' }}>EMAIL <span style={{ color: '#d1d5db', fontWeight: 400 }}>— ixtiyoriy</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="ali@company.uz" onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} style={fieldStyle('email')} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: '0.04em' }}>XABAR</label>
                <textarea value={form.message} onChange={set('message')} placeholder="Savolingiz yoki taklifingizni yozing..." required rows={4} onFocus={() => setFocused('msg')} onBlur={() => setFocused(null)} style={{ ...fieldStyle('msg'), resize: 'vertical' as const, minHeight: 100 }} />
              </div>
              <button type="submit" disabled={status === 'sending'} style={{ marginTop: 4, padding: '14px', background: status === 'sending' ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 700, cursor: status === 'sending' ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                {status === 'sending' ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>Yuborilmoqda...</>
                ) : '📨 Xabar yuborish'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  const { loginAsDemo } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemo = () => { loginAsDemo(); nav('/dashboard'); };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: '#f7f8ff', color: '#1e1f2e', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5%', background: scrolled ? 'rgba(247,248,255,0.93)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(99,102,241,0.1)' : '1px solid transparent', transition: 'all 0.3s ease' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <ChartLogo size={20} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e1f2e', letterSpacing: '-0.03em' }}>FinanceBot</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setContactOpen(true)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e5e7f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b7280', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7f0'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >Bog'lanish</button>
            <button onClick={handleDemo} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e5e7f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7f0'; }}
            >🎮 Demo</button>
            <button onClick={() => nav('/login')} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
            >Kirish →</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.1) 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-8%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '0', width: 280, height: 280, background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 32 }}>
            🇺🇿 O'zbek biznesi uchun yaratilgan · Hozir bepul
          </div>
          <h1 style={{ fontSize: 'clamp(38px,6vw,66px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 26px', letterSpacing: '-0.04em', color: '#1e1f2e' }}>
            Biznes moliyangizni<br />
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Telegram orqali boshqaring
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 44px' }}>
            Ovozli xabar yuboring — tranzaksiya saqlandi. Real-vaqt dashboard, AI tahlil va byudjet nazorati.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/register')} style={{ padding: '15px 34px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff', boxShadow: '0 8px 28px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
            >Bepul boshlash →</button>
            <button onClick={handleDemo} style={{ padding: '15px 28px', borderRadius: 13, border: '1.5px solid #e5e7f0', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7f0'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
            >🎮 Demo versiyani ko'rish</button>
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: '#c4c9e0' }}>Kredit karta kerak emas · 1 daqiqada tayyor</p>
        </div>

        {/* Dashboard mockup */}
        <div style={{ maxWidth: 900, width: '100%', margin: '72px auto 0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 32px 80px rgba(99,102,241,0.12)', background: '#fff', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(28px)', transition: 'opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s', position: 'relative', zIndex: 1 }}>
          <div style={{ background: '#f3f4f9', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #eaecf5' }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
            <div style={{ flex: 1, background: '#eaecf5', borderRadius: 6, height: 24, margin: '0 14px', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>app.financebot.uz/dashboard</span>
            </div>
          </div>
          <div style={{ padding: '20px 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, background: '#fafbff' }}>
            {[
              { label: 'Umumiy kirim', val: '39 200 000', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '↑', change: '+24.4%' },
              { label: 'Umumiy chiqim', val: '6 930 000', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '↓', change: '-3.7%' },
              { label: 'Sof foyda', val: '32 270 000', color: '#6366f1', bg: '#eff2ff', border: '#c7d2fe', icon: '◆', change: '+32.8%' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: c.color }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1f2e', letterSpacing: '-0.03em', marginBottom: 3 }}>{c.val} <span style={{ fontSize: 10, color: '#c4c9e0', fontWeight: 500 }}>UZS</span></div>
                <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.change}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', background: '#fafbff', borderTop: '1px solid #eaecf5' }}>
            {[
              { icon: '💰', cat: 'Savdo', amount: '+12 500 000', t: 'income', time: '2 soat oldin' },
              { icon: '📦', cat: 'Logistika', amount: '-850 000', t: 'expense', time: '4 soat oldin' },
              { icon: '🛠', cat: 'Xizmat', amount: '+4 300 000', t: 'income', time: 'Kecha' },
              { icon: '👷', cat: 'Maosh', amount: '-2 100 000', t: 'expense', time: 'Kecha' },
            ].map((tx, i) => (
              <div key={i} style={{ flex: '1 1 180px', background: '#fff', borderRadius: 10, padding: '10px 13px', border: '1px solid #eaecf5', display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: 18 }}>{tx.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{tx.cat}</div>
                  <div style={{ fontSize: 11, color: '#c4c9e0' }}>{tx.time}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tx.t === 'income' ? '#16a34a' : '#dc2626' }}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 5%', background: '#fff', borderTop: '1px solid #eaecf5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{ display: 'inline-block', color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>Imkoniyatlar</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.04em' }}>Nima uchun FinanceBot?</h2>
              <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>O'zbek kichik va o'rta biznesi uchun maxsus. Murakkab emas — samarali.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div style={{ padding: '28px', borderRadius: 16, border: '1.5px solid #eaecf5', background: '#fafbff', cursor: 'default', transition: 'all 0.25s', height: '100%', boxSizing: 'border-box' as const }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#c7d2fe'; el.style.background = '#f0f1ff'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 28px rgba(99,102,241,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#eaecf5'; el.style.background = '#fafbff'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 9px', color: '#1e1f2e' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 5%', background: '#f7f8ff', borderTop: '1px solid #eaecf5' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{ display: 'inline-block', color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>Jarayon</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.04em' }}>Qanday ishlaydi?</h2>
              <p style={{ color: '#6b7280', fontSize: 16 }}>4 qadamda biznes moliyangizni tartibga soling</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ padding: '32px 22px', borderRadius: 16, background: '#fff', border: '1.5px solid #eaecf5', textAlign: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#c7d2fe', marginBottom: 14, letterSpacing: '0.1em' }}>{s.n}</div>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>{s.emoji}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#1e1f2e' }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                  {i < steps.length - 1 && <div style={{ position: 'absolute', right: -18, top: '42%', color: '#c7d2fe', fontSize: 20 }}>→</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '100px 5%', background: '#fff', borderTop: '1px solid #eaecf5' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ display: 'inline-block', color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>Fikrlar</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>Foydalanuvchilar nima deydi</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ padding: '28px', borderRadius: 16, border: '1.5px solid #eaecf5', background: '#fafbff', height: '100%', boxSizing: 'border-box' as const }}>
                  <div style={{ display: 'flex', gap: 1, marginBottom: 16 }}>{[...Array(5)].map((_, j) => <span key={j} style={{ color: '#fbbf24', fontSize: 14 }}>★</span>)}</div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, margin: '0 0 24px', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1f2e' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '100px 5%', background: '#f7f8ff', borderTop: '1px solid #eaecf5' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ display: 'inline-block', color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>Narxlar</span>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.04em' }}>Oddiy va shaffof narxlar</h2>
              <p style={{ color: '#6b7280', fontSize: 16 }}>Barcha planlar 14 kun bepul sinab ko'rish bilan</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {plans.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ borderRadius: 18, border: i === 1 ? '2px solid #6366f1' : '1.5px solid #eaecf5', background: i === 1 ? 'linear-gradient(160deg,#1e1f2e,#252847)' : '#fff', color: i === 1 ? '#e5e7eb' : '#1e1f2e', position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box' as const, boxShadow: i === 1 ? '0 16px 48px rgba(99,102,241,0.2)' : '0 2px 8px rgba(0,0,0,0.03)' }}>
                  {i === 1 && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />}
                  {p.badge && <div style={{ position: 'absolute', top: 18, right: 18, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>{p.badge}</div>}
                  <div style={{ padding: '28px 28px 20px', position: 'relative' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? '#a5b4fc' : '#9ca3af', marginBottom: 10 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em' }}>{p.price}</span>
                      {p.per && <span style={{ fontSize: 13, color: i === 1 ? '#6b7280' : '#c4c9e0' }}>/{p.per}</span>}
                    </div>
                    {i < 2 && <div style={{ fontSize: 11, color: i === 1 ? '#4b5563' : '#d1d5db', marginTop: 3 }}>UZS</div>}
                  </div>
                  <div style={{ padding: '0 28px 28px', position: 'relative' }}>
                    <div style={{ height: 1, background: i === 1 ? 'rgba(255,255,255,0.07)' : '#f0f1f8', marginBottom: 20 }} />
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {p.features.map((f, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: i === 1 ? '#9ca3af' : '#6b7280' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 1 ? 'rgba(99,102,241,0.25)' : '#eff2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: i === 1 ? '#a5b4fc' : '#6366f1', flexShrink: 0 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => i === 2 ? setContactOpen(true) : nav('/register')}
                      style={{ width: '100%', padding: '13px', borderRadius: 12, border: i === 1 ? 'none' : '1.5px solid #eaecf5', background: i === 1 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : i === 2 ? 'transparent' : '#f7f8ff', color: i === 1 ? 'white' : i === 2 ? '#a5b4fc' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: i === 1 ? '0 4px 16px rgba(99,102,241,0.35)' : 'none' }}
                      onMouseEnter={e => { if (i !== 1) (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; }}
                      onMouseLeave={e => { if (i !== 1) (e.currentTarget as HTMLButtonElement).style.borderColor = '#eaecf5'; }}
                    >{i === 2 ? 'Muzokaraga yozing' : 'Boshlash →'}</button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '110px 5%', background: '#fff', borderTop: '1px solid #eaecf5', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <Reveal>
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              <ChartLogo size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 800, color: '#1e1f2e', margin: '0 0 18px', letterSpacing: '-0.04em', lineHeight: 1.15 }}>Bugun boshlang</h2>
            <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 44, lineHeight: 1.75 }}>
              10 daqiqada butun moliya sistemangizni tartibga soling. Savollaringiz bormi? Jamoamiz tayyor.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => nav('/register')} style={{ padding: '15px 34px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff', boxShadow: '0 8px 28px rgba(99,102,241,0.35)', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
              >Bepul ro'yxatdan o'ting →</button>
              <button onClick={() => setContactOpen(true)} style={{ padding: '15px 26px', borderRadius: 13, border: '1.5px solid #e5e7f0', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7f0'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
              >📨 Jamoa bilan bog'laning</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '26px 5%', background: '#f7f8ff', borderTop: '1px solid #eaecf5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChartLogo size={14} color="#fff" />
            </div>
            <span style={{ color: '#9ca3af', fontSize: 13 }}>FinanceBot © {new Date().getFullYear()} · O'zbekiston biznesi uchun</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {([['Kirish', () => nav('/login')], ["Ro'yxatdan o'tish", () => nav('/register')], ["Bog'lanish", () => setContactOpen(true)]] as [string, () => void][]).map(([label, fn]) => (
              <button key={label} onClick={fn} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'}
              >{label}</button>
            ))}
          </div>
        </div>
      </footer>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}