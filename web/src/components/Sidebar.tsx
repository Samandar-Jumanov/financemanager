import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart2, Tag, Target, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../auth';
import ChartLogo from './ChartLogo';

const links = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Asosiy'         },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Tranzaksiyalar' },
  { to: '/analytics',    icon: BarChart2,        label: 'Tahlil'         },
  { to: '/categories',   icon: Tag,              label: 'Kategoriyalar'  },
  { to: '/budgets',      icon: Target,           label: 'Byudjet'        },
];

export default function Sidebar() {
  const { user, isDemo, logout } = useAuth();
  const nav = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 flex flex-col z-10">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <ChartLogo size={20} color="#fff" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm tracking-tight">FinanceBot</div>
            <div className="text-xs text-gray-400">Business Dashboard</div>
          </div>
        </div>
        {isDemo && (
          <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
            🎮 Demo rejim
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }>
            <Icon size={17} /> {label}
          </NavLink>
        ))}
        <div className="pt-2 mt-2 border-t border-gray-100">
          <NavLink to="/account"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }>
            <UserCircle size={17} /> Mening hisobim
          </NavLink>
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <NavLink to="/account" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{user?.fullName || user?.username}</div>
            <div className="text-xs text-gray-400">{isDemo ? 'Demo' : user?.plan || 'free'} plan</div>
          </div>
        </NavLink>
        <button onClick={() => { logout(); nav('/'); }}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={15} /> Chiqish
        </button>
      </div>
    </aside>
  );
}
