import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Account from './pages/Account';


function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ minHeight:'100vh', background:'#f7f8ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#9ca3af', fontSize:14 }}>Yuklanmoqda...</div>
    </div>;
  }

  // Public routes — accessible always
  if (location.pathname === '/')         return <Landing />;
  if (location.pathname === '/login')    return <Login />;
  if (location.pathname === '/register') return <Register />;

  // Protected — need user (real or demo).
  // Also check localStorage directly: loginAsDemo() sets it synchronously,
  // but React's setUser() re-render may not have finished yet by the time
  // nav('/dashboard') fires — causing a false redirect to /login.
  const lsUser = localStorage.getItem('user');
  if (!user && !lsUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <Routes>
          <Route path="/dashboard"    element={<Overview />}     />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics"    element={<Analytics />}    />
          <Route path="/categories"   element={<Categories />}   />
          <Route path="/budgets"      element={<Budgets />}      />
          <Route path="/account"      element={<Account />}      />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </AuthProvider>
  );
}
