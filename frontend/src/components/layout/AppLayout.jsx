import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, FileBarChart, LogOut, Menu, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/readings', label: 'Readings', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-5 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:hidden' : 'lg:translate-x-0'}`}
      >
        <div className="mb-8 px-2"><Logo light /></div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-base-300/60 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle navigation"
            onClick={() => (window.matchMedia('(min-width: 1024px)').matches ? setCollapsed((c) => !c) : setMobileOpen((o) => !o))}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="dropdown dropdown-end">
            <button type="button" tabIndex={0} className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-base-200" aria-label="Account menu">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
            </button>
            <ul tabIndex={0} className="menu dropdown-content z-30 mt-2 w-56 rounded-xl border border-base-300/60 bg-white p-2 shadow-lg">
              <li className="menu-title truncate normal-case">{user.email}</li>
              <li><button type="button" onClick={handleLogout}><LogOut className="h-4 w-4" aria-hidden="true" />Logout</button></li>
            </ul>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
