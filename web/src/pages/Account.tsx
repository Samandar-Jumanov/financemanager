import { useState } from 'react';
import { useAuth } from '../auth';
import { authApi } from '../api';
import { User, Lock, Bell, Zap, LogOut, Check, ChevronRight, Bot, Link, Copy, RefreshCw, Unlink } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';

const PLAN_FEATURES = {
  free:       { label:'Bepul',      color:'#6b7280', bg:'#f3f4f6', features:['50 tranzaksiya/oy','5 kategoriya','Asosiy dashboard'] },
  pro:        { label:'Pro',        color:'#4f6ef7', bg:'#eff2ff', features:['Cheksiz tranzaksiyalar','AI tahlil','Byudjet nazorati','Ovozli buyruqlar','CSV Export'] },
  enterprise: { label:'Korporativ', color:'#7c3aed', bg:'#f5f3ff', features:["Pro + hammasi","Ko'p foydalanuvchi",'API kirish','Dedikatsiyalangan support'] },
};

const NOTIFICATION_DEFAULTS = {
  budget_warning:    true,
  bot_transactions:  true,
  monthly_report:    false,
  large_transaction: false,
};

function loadNotifPrefs(): typeof NOTIFICATION_DEFAULTS {
  try {
    const saved = localStorage.getItem('notif_prefs');
    return saved ? { ...NOTIFICATION_DEFAULTS, ...JSON.parse(saved) } : { ...NOTIFICATION_DEFAULTS };
  } catch { return { ...NOTIFICATION_DEFAULTS }; }
}

function saveNotifPrefs(prefs: typeof NOTIFICATION_DEFAULTS) {
  localStorage.setItem('notif_prefs', JSON.stringify(prefs));
}

export default function Account() {
  const { user, isDemo, logout, refreshUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'profile'|'security'|'plan'|'notifications'|'telegram'>('profile');

  // Profile
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName||'', company: user?.company||'', email: user?.email||'' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState('');

  // Password
  const [passForm, setPassForm]   = useState({ old:'', next:'', confirm:'' });
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg]       = useState('');
  const [passError, setPassError]   = useState('');

  // Notifications — persisted in localStorage
  const [notifs, setNotifs] = useState<typeof NOTIFICATION_DEFAULTS>(loadNotifPrefs);

  const toggleNotif = (key: keyof typeof NOTIFICATION_DEFAULTS) => {
    if (isDemo) return;
    setNotifs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveNotifPrefs(next);
      return next;
    });
  };


  // Telegram linking
  const [linkToken, setLinkToken]     = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [unlinking, setUnlinking]     = useState(false);
  const [telegramId, setTelegramId]   = useState((user as any)?.telegramId || '');

  const generateToken = async () => {
    if (isDemo) return;
    setTokenLoading(true);
    try {
      const res = await authApi.generateLinkToken();
      setLinkToken(res.token);
    } catch {
      toast.error('Xatolik', 'Token yaratishda muammo yuz berdi. Qaytadan urining.');
    } finally { setTokenLoading(false); }
  };

  const copyToken = () => {
    if (!linkToken) return;
    navigator.clipboard.writeText(`/link ${linkToken}`);
    setTokenCopied(true);
    toast.info('Nusxalandi!', 'Tokenni Telegramda botga yuboring');
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const unlinkTelegram = async () => {
    if (isDemo) return;
    const ok = await confirm({
      title: 'Telegramdan ajratish',
      message: "Bot bilan aloqa uziladi. Keyinchalik qayta ulashingiz mumkin.",
      confirmLabel: 'Ha, ajrat',
      cancelLabel: 'Bekor',
      variant: 'warning',
      icon: 'unlink',
    });
    if (!ok) return;
    setUnlinking(true);
    try {
      await authApi.unlinkTelegram();
      setTelegramId('');
      setLinkToken('');
      await refreshUser();
      toast.success('Ajratildi', 'Telegram hisobi dashboarddan uzildi');
    } catch {
      toast.error('Xatolik', 'Ajratishda muammo yuz berdi. Qaytadan urining.');
    } finally { setUnlinking(false); }
  };

  const plan       = PLAN_FEATURES[(user?.plan as keyof typeof PLAN_FEATURES) || 'free'];
  const memberDays = user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) : 0;

  const saveProfile = async () => {
    if (isDemo) return;
    setProfileSaving(true); setProfileMsg('');
    try {
      await authApi.updateProfile(profileForm);
      await refreshUser();
      setProfileMsg('✓ Saqlandi!');
      toast.success('Profil yangilandi', "Ma'lumotlar muvaffaqiyatli saqlandi");
      setTimeout(() => setProfileMsg(''), 3000);
    } catch {
      setProfileMsg('Xatolik');
      toast.error('Xatolik', 'Saqlashda muammo yuz berdi');
    } finally { setProfileSaving(false); }
  };

  const changePass = async () => {
    if (isDemo) return;
    setPassError(''); setPassMsg('');
    if (!passForm.old || !passForm.next) return setPassError("Barcha maydonlarni to'ldiring");
    if (passForm.next.length < 6) return setPassError('Yangi parol kamida 6 ta belgi');
    if (passForm.next !== passForm.confirm) return setPassError('Parollar mos emas');
    setPassSaving(true);
    try {
      await authApi.changePassword(passForm.old, passForm.next);
      setPassForm({ old:'', next:'', confirm:'' });
      setPassMsg("✓ Parol o'zgartirildi!");
      toast.success("Parol o'zgartirildi", 'Yangi parol muvaffaqiyatli saqlandi');
      setTimeout(() => setPassMsg(''), 4000);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Xatolik';
      setPassError(msg);
      toast.error("Parol o'zgartirilmadi", msg);
    } finally { setPassSaving(false); }
  };

  const tabs = [
    { id:'profile',       label:'Profil',        Icon:User },
    { id:'security',      label:'Xavfsizlik',    Icon:Lock },
    { id:'plan',          label:'Reja & Hisob',  Icon:Zap  },
    { id:'telegram',      label:'Telegram Bot',  Icon:Bot  },
    { id:'notifications', label:'Bildirishnoma', Icon:Bell },
  ] as const;

  const Field = ({ label, value, onChange, type='text', disabled=false }: any) => (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
        style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, color:disabled?'#94a3b8':'#0f172a', background:disabled?'#f8fafc':'white', outline:'none' }}
        onFocus={e=>{ if(!disabled) e.target.style.borderColor='#4f6ef7'; }}
        onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; }} />
    </div>
  );

  const notifItems = [
    { key:'budget_warning'    as const, title:'Byudjet ogohlantirishlari',   desc:'Kategoriya limiti 80% ga yetganda' },
    { key:'bot_transactions'  as const, title:'Telegram bot xabarlari',       desc:'Bot tranzaksiyalarni saqlganda'     },
    { key:'monthly_report'    as const, title:'Oylik hisobot',                desc:'Har oy boshida xulosa xabari'       },
    { key:'large_transaction' as const, title:"Noodatiy tranzaksiyalar",      desc:"Katta summa kiritilganda"           },
  ];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mening hisobim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Profil, xavfsizlik va reja sozlamalari</p>
        </div>
        {isDemo && (
          <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:12, padding:'10px 16px', fontSize:13 }}>
            <span style={{ color:'#92400e', fontWeight:600 }}>🎮 Demo rejim</span>
            <span style={{ color:'#a16207', marginLeft:8 }}>O'zgarishlar saqlanmaydi</span>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div style={{ background:'linear-gradient(135deg,#1a1d28,#1e2445)', borderRadius:20, padding:'24px 28px', marginBottom:28, color:'white', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#4f6ef7,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, flexShrink:0 }}>
          {user?.fullName?.[0]?.toUpperCase()||user?.username?.[0]?.toUpperCase()||'A'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>{user?.fullName||user?.username}</div>
          <div style={{ fontSize:13, color:'#9ca3af', display:'flex', gap:16, flexWrap:'wrap' }}>
            {user?.company && <span>🏢 {user.company}</span>}
            {user?.email   && <span>✉️ {user.email}</span>}
            <span>📅 {memberDays} kun a'zo</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 14px' }}>
            <Zap size={14} color="#a5b4fc" />
            <span style={{ fontSize:13, fontWeight:700, color:'#a5b4fc' }}>{plan.label} Plan</span>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24 }}>
        {/* Sidebar tabs */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:'none', background:tab===id?'#eff2ff':'transparent', color:tab===id?'#4f6ef7':'#64748b', fontSize:13, fontWeight:tab===id?600:500, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
              <Icon size={16}/>{label}
              {tab===id && <ChevronRight size={14} style={{ marginLeft:'auto' }}/>}
            </button>
          ))}
          <div style={{ marginTop:'auto', paddingTop:16, borderTop:'1px solid #e2e8f0' }}>
            <button onClick={() => { logout(); window.location.href='/'; }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:'none', background:'transparent', color:'#ef4444', fontSize:13, fontWeight:500, cursor:'pointer', width:'100%' }}>
              <LogOut size={16}/> Chiqish
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ background:'white', borderRadius:18, border:'1.5px solid #e2e8f0', padding:28 }}>

          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:'0 0 20px' }}>Shaxsiy ma'lumotlar</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <Field label="To'liq ism" value={profileForm.fullName} onChange={(v:string)=>setProfileForm(f=>({...f,fullName:v}))} disabled={isDemo} />
                <Field label="Kompaniya"  value={profileForm.company}  onChange={(v:string)=>setProfileForm(f=>({...f,company:v}))}  disabled={isDemo} />
                <Field label="Email" type="email" value={profileForm.email} onChange={(v:string)=>setProfileForm(f=>({...f,email:v}))} disabled={isDemo} />
                <Field label="Username" value={user?.username||''} onChange={()=>{}} disabled />
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <button onClick={saveProfile} disabled={profileSaving||isDemo}
                    style={{ padding:'10px 22px', borderRadius:10, border:'none', background:isDemo?'#e2e8f0':'linear-gradient(135deg,#4f6ef7,#6d4aed)', color:isDemo?'#94a3b8':'white', fontSize:13, fontWeight:600, cursor:isDemo?'not-allowed':'pointer' }}>
                    {profileSaving?'Saqlanmoqda...':'Saqlash'}
                  </button>
                  {profileMsg && <span style={{ color:'#16a34a', fontSize:13, fontWeight:600 }}>{profileMsg}</span>}
                  {isDemo && <span style={{ color:'#f59e0b', fontSize:12 }}>Demo rejimda saqlanmaydi</span>}
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>Parolni o'zgartirish</h3>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 24px' }}>Xavfsizlik uchun kuchli parol ishlating</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:400 }}>
                <Field label="Joriy parol"          type="password" value={passForm.old}     onChange={(v:string)=>setPassForm(f=>({...f,old:v}))}     disabled={isDemo} />
                <Field label="Yangi parol"          type="password" value={passForm.next}    onChange={(v:string)=>setPassForm(f=>({...f,next:v}))}    disabled={isDemo} />
                <Field label="Yangi parolni tasdiqlang" type="password" value={passForm.confirm} onChange={(v:string)=>setPassForm(f=>({...f,confirm:v}))} disabled={isDemo} />
                {passError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13 }}>⚠️ {passError}</div>}
                {passMsg   && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', color:'#16a34a',  fontSize:13 }}>{passMsg}</div>}
                <button onClick={changePass} disabled={passSaving||isDemo}
                  style={{ padding:'10px 22px', borderRadius:10, border:'none', background:isDemo?'#e2e8f0':'#dc2626', color:isDemo?'#94a3b8':'white', fontSize:13, fontWeight:600, cursor:isDemo?'not-allowed':'pointer', width:'fit-content' }}>
                  {passSaving?"Saqlanmoqda...":"Parolni o'zgartirish"}
                </button>
              </div>
              <div style={{ marginTop:32, padding:20, background:'#f8fafc', borderRadius:14, border:'1.5px solid #e2e8f0' }}>
                <h4 style={{ fontSize:14, fontWeight:600, color:'#374151', margin:'0 0 12px' }}>🔒 Xavfsizlik maslahatlari</h4>
                {['Kamida 8 ta belgi ishlating',"Raqam va maxsus belgilar qo'shing","Boshqa saytlardagi parolni ishlatmang","Parolni hech kim bilan ulashmang"].map((tip,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, fontSize:13, color:'#64748b', marginBottom:6 }}>
                    <Check size={14} color="#16a34a" style={{ marginTop:2, flexShrink:0 }}/> {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'plan' && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>Sizning rejangiz</h3>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 24px' }}>Hozirgi holat va imkoniyatlar</p>
              <div style={{ background:plan.bg, border:`1.5px solid ${plan.color}30`, borderRadius:16, padding:'20px 24px', marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:plan.color, fontWeight:700, letterSpacing:'0.08em', marginBottom:4 }}>HOZIRGI REJA</div>
                    <div style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>{plan.label}</div>
                  </div>
                  <div style={{ width:48, height:48, borderRadius:14, background:plan.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Zap size={22} color="white"/>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {plan.features.map((f,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, fontSize:13, color:'#374151' }}>
                      <Check size={14} color={plan.color} style={{ marginTop:2, flexShrink:0 }}/> {f}
                    </div>
                  ))}
                </div>
              </div>
              {user?.plan !== 'pro' && (
                <div style={{ background:'linear-gradient(135deg,#1a1d28,#1e2445)', borderRadius:16, padding:'20px 24px', color:'white' }}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>🚀 Pro rejaga o'ting</div>
                  <div style={{ fontSize:13, color:'#9ca3af', marginBottom:16 }}>Oyiga 99 000 UZS — barcha imkoniyatlar cheksiz</div>
                  <button style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f6ef7,#6d4aed)', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Upgrade → Pro
                  </button>
                </div>
              )}
              <div style={{ marginTop:20, padding:'16px 20px', background:'#f8fafc', borderRadius:12, border:'1.5px solid #e2e8f0', display:'flex', gap:16, flexWrap:'wrap' }}>
                {[{label:"A'zolik muddati",val:`${memberDays} kun`},{label:"Hisob turi",val:user?.role||'admin'},{label:"ID",val:(user?.id||'').slice(0,8)+'...'}].map(i=>(
                  <div key={i.label}>
                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>{i.label}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#374151' }}>{i.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {tab === 'telegram' && (
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:6 }}>Telegram Bot ulanish</h3>
              <p style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Bot orqali ovozli yoki matn xabar yuborib tranzaksiya qo'shing — dashboard da real-vaqtda ko'rinadi.</p>

              {telegramId ? (
                <div>
                  <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:20 }}>✅</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>Hisob ulangan</div>
                      <div style={{ fontSize:12, color:'#16a34a' }}>Telegram ID: {telegramId}</div>
                    </div>
                  </div>
                  <a href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'your_financebot'}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', background:'#4f6ef7', color:'#fff', borderRadius:10, fontSize:13, fontWeight:600, textDecoration:'none', marginBottom:10 }}>
                    <Bot size={14} /> Botni ochish
                  </a>
                  <button onClick={unlinkTelegram} disabled={unlinking}
                    style={{ width:'100%', padding:'10px 16px', background:'transparent', border:'1px solid #fca5a5', color:'#dc2626', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    <Unlink size={13} style={{ display:'inline', marginRight:6 }} />
                    {unlinking ? 'Ajratilmoqda...' : 'Telegramdan ajratish'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom:16 }}>
                    {[
                      `@${import.meta.env.VITE_BOT_USERNAME || 'your_financebot'} botini Telegramda oching`,
                      '/start yuboring',
                      'Quyida token yarating',
                      '/link <token> shaklida yuboring',
                    ].map((step, i) => (
                      <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'#eff2ff', color:'#4f6ef7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                        <div style={{ fontSize:13, color:'#475569', paddingTop:2 }}>{step}</div>
                      </div>
                    ))}
                  </div>

                  {linkToken ? (
                    <div>
                      <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                        <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, fontWeight:600 }}>BOTGA YUBORING:</div>
                        <code style={{ fontSize:12, color:'#4f6ef7', wordBreak:'break-all' }}>
                          /link {linkToken}
                        </code>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={copyToken}
                          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 14px', background:'#4f6ef7', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                          {tokenCopied ? <><Check size={13} /> Nusxalandi!</> : <><Copy size={13} /> Nusxalash</>}
                        </button>
                        <button onClick={generateToken} title="Yangi token"
                          style={{ padding:'10px 12px', background:'transparent', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', color:'#64748b' }}>
                          <RefreshCw size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:8, textAlign:'center' }}>Token 15 daqiqada eskiradi</div>
                    </div>
                  ) : (
                    <button onClick={generateToken} disabled={tokenLoading || isDemo}
                      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', background:'#4f6ef7', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', opacity: tokenLoading||isDemo ? 0.6 : 1 }}>
                      <Link size={14} />
                      {tokenLoading ? 'Yaratilmoqda...' : 'Token yaratish'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>Bildirishnomalar</h3>
              <p style={{ fontSize:13, color:'#64748b', margin:'0 0 4px' }}>Qaysi hodisalar haqida xabar olishni istaysiz?</p>
              {isDemo && <p style={{ fontSize:12, color:'#f59e0b', marginBottom:16 }}>⚠️ Demo rejimda sozlamalar saqlanmaydi</p>}
              {!isDemo && <p style={{ fontSize:12, color:'#16a34a', marginBottom:16 }}>✓ Sozlamalar qurilmangizda saqlanadi</p>}
              {notifItems.map(n => (
                <div key={n.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#0f172a', marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>{n.desc}</div>
                  </div>
                  <button
                    onClick={() => toggleNotif(n.key)}
                    title={isDemo ? 'Demo rejimda o\'zgartirish mumkin emas' : undefined}
                    style={{ width:44, height:24, borderRadius:12, border:'none', background:notifs[n.key]?'#4f6ef7':'#e2e8f0', cursor:isDemo?'not-allowed':'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:notifs[n.key]?23:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
