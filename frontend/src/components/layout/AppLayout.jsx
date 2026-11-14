
import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  LogOut,
  Menu,
  ChevronDown,
  Users,
  Bell,
  CheckCheck,
  Droplet,
  Loader2,
} from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import Logo from '../common/Logo';
import ConfirmModal from '../common/ConfirmModal';

const PATIENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/readings', label: 'Readings', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [readBusy, setReadBusy] = useState(null);

  const notificationRef = useRef(null);

  const isPatient = user?.role === 'PATIENT';

  const NAV =
    user?.role === 'DOCTOR'
      ? [{ to: '/doctor', label: 'Patients', icon: Users }]
      : user?.role === 'ADMIN'
        ? [{ to: '/admin', label: 'Assignments', icon: Users }]
        : PATIENT_NAV;

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!isPatient) return;

    if (showLoading) setNotificationLoading(true);

    try {
      const res = await notificationsApi.list();

      const data = res?.data || {};

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Notification fetch failed:', error);
    } finally {
      if (showLoading) setNotificationLoading(false);
    }
  }, [isPatient]);

  useEffect(() => {
    if (!isPatient) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [isPatient, fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;

    setNotificationOpen(nextState);

    if (nextState) {
      await fetchNotifications(true);
    }
  };

  const handleMarkRead = async (id) => {
    setReadBusy(id);

    try {
      await notificationsApi.markRead(id);
      await fetchNotifications();

    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        'Unable to update notification.'
      );
    } finally {
      setReadBusy(null);
    }
  };

  const handleMarkAllRead = async () => {
    setReadBusy('all');

    try {
      await notificationsApi.markAllRead();

      await fetchNotifications();

      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        'Unable to update notifications.'
      );
    } finally {
      setReadBusy(null);
    }
  };

  const handleLogoutClick = () => {
    setLogoutOpen(true);
  };

  const cancelLogout = () => {
    if (logoutBusy) return;
    setLogoutOpen(false);
  };

  const handleLogout = async () => {
    if (logoutBusy) return;

    setLogoutBusy(true);

    try {
      await logout();

      setLogoutOpen(false);

      toast.success('Logged out successfully');

      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to logout. Please try again.'
      );
    } finally {
      setLogoutBusy(false);
    }
  };

  const formatReminderDate = (date) => {
    if (!date) return '';

    const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen bg-base-200">

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-5 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          collapsed ? 'lg:hidden' : 'lg:translate-x-0'
        }`}
      >
        <div className="mb-8 px-2">
          <Logo light />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-base-300/60 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle navigation"
            onClick={() =>
              window.matchMedia('(min-width: 1024px)').matches
                ? setCollapsed((c) => !c)
                : setMobileOpen((o) => !o)
            }
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Account and notifications */}
          <div className="flex items-center gap-3">

            {/* Notification bell - Patients only */}
            {isPatient && (
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={notificationOpen}
                  className="relative grid h-10 w-10 place-items-center rounded-xl text-base-content transition-colors hover:bg-base-200"
                >
                  <Bell className="h-5 w-5" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-white bg-error px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-base-300 bg-white shadow-xl">

                    <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Notifications
                        </h3>
                        <p className="text-xs text-muted">
                          {unreadCount} unread
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={readBusy !== null}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto">

                      {notificationLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                          <Bell className="h-8 w-8 text-base-300" />
                          <p className="text-sm font-medium">
                            No notifications yet
                          </p>
                          <p className="text-xs text-muted">
                            Your reminders will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`flex gap-3 border-b border-base-200 px-4 py-3 last:border-0 ${
                              !item.read_at ? 'bg-primary/5' : 'bg-white'
                            }`}
                          >
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
                              <Droplet className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  Daily Glucose Reminder
                                </p>

                                {!item.read_at && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-error" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-muted">
                                Please complete your glucose readings for{' '}
                                {formatReminderDate(item.reminder_date)}.
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-muted">
                                  {formatReminderDate(item.reminder_date)}
                                </span>

                                {!item.read_at && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkRead(item.id)}
                                    disabled={readBusy !== null}
                                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                                  >
                                    {readBusy === item.id
                                      ? 'Updating...'
                                      : 'Mark as read'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-base-200 px-4 py-2">
                      <p className="text-center text-[11px] text-muted">
                        Showing latest 50 notifications
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account dropdown */}
            <div className="dropdown dropdown-end">

              <button
                type="button"
                tabIndex={0}
                className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-base-200"
                aria-label="Account menu"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>

                <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">
                  {user.name}
                </span>

                <ChevronDown
                  className="h-4 w-4 text-muted"
                  aria-hidden="true"
                />
              </button>

              <ul
                tabIndex={0}
                className="menu dropdown-content z-30 mt-2 w-56 rounded-xl border border-base-300/60 bg-white p-2 shadow-lg"
              >
                <li className="menu-title truncate normal-case">
                  {user.email}
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      {/* Logout confirmation modal */}
      <ConfirmModal
        open={logoutOpen}
        title="Are you sure you want to logout?"
        message="You will be logged out of your account. Are you sure you want to continue?"
        confirmLabel="Logout"
        loading={logoutBusy}
        onConfirm={handleLogout}
        onCancel={cancelLogout}
      />

    </div>
  );
}
