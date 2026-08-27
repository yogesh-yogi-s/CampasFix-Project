'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  LogOut, 
  PlusCircle, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  User, 
  Menu, 
  X,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (user?.id) {
        const raw = localStorage.getItem(`campusfix_notif_prefs_${user.id}`);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (prefs.inApp === false) {
            setNotifications([]);
            setUnreadCount(0);
            return;
          }
        }
      }
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.notifications.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time notifications
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        if (user?.id) {
          try {
            const raw = localStorage.getItem(`campusfix_notif_prefs_${user.id}`);
            if (raw && JSON.parse(raw).inApp === false) return;
          } catch {
            /* ignore */
          }
        }
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [user?.id]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const notif of unread) {
      await handleMarkAsRead(notif.id);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'status_change':
        return <Info className="h-4 w-4 text-teal-400" />;
      case 'assignment':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  // Sidebar Links based on role
  const navLinks = user?.role === 'admin' 
    ? [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: BarChart3 },
        { label: 'Manage Complaints', path: '/admin/complaints', icon: ClipboardList },
        { label: 'Settings', path: '/settings', icon: Settings }
      ]
    : [
        { label: 'My Dashboard', path: '/dashboard', icon: BarChart3 },
        { label: 'Report Issue', path: '/complaints/new', icon: PlusCircle },
        { label: 'My Complaints', path: '/complaints', icon: ClipboardList },
        { label: 'Settings', path: '/settings', icon: Settings }
      ];

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent tracking-wider">
              CampusFix
            </span>
            <span className="text-xs bg-slate-800 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-950">
              v1.0
            </span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-teal-300 font-bold uppercase">
              {user?.name?.slice(0, 2) || 'CF'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold truncate">{user?.name || 'Loading...'}</h4>
              <p className="text-xs text-slate-400 font-mono capitalize">{user?.role || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link, idx) => {
            const Icon = link.icon;
            const active = pathname === link.path;
            return (
              <Link
                key={idx}
                href={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                  active 
                    ? 'bg-slate-800/80 border-slate-700 text-teal-400 font-semibold shadow-md shadow-slate-950' 
                    : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-805">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-950/20 active:bg-rose-950/30 transition-all duration-200 border border-transparent hover:border-rose-900/35"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-900/80 z-20">
          <button 
            className="md:hidden p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden md:block">
            <span className="text-xs text-slate-400 font-mono">Console System Ready</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Drawer Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg border bg-slate-900 transition-all relative ${
                  showNotifications 
                    ? 'border-indigo-600 text-indigo-400' 
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[380px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-[10px] text-teal-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[280px]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-3 text-xs transition-colors relative cursor-pointer ${
                            notif.is_read ? 'opacity-65' : 'bg-indigo-950/20'
                          }`}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <div className="flex gap-2">
                            <span className="mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-200">{notif.title}</p>
                              <p className="text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          {!notif.is_read && (
                            <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200">
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <span className="text-lg font-bold text-teal-400 font-mono">CampusFix</span>
                <button 
                  className="p-1 rounded-lg border border-slate-800 text-slate-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-900 flex items-center justify-center text-teal-300 font-bold uppercase text-xs">
                    {user?.name?.slice(0, 2) || 'CF'}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">{user?.name}</h4>
                    <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                {navLinks.map((link, idx) => {
                  const Icon = link.icon;
                  const active = pathname === link.path;
                  return (
                    <Link
                      key={idx}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border ${
                        active 
                          ? 'bg-slate-800/80 border-slate-700 text-teal-400 font-semibold' 
                          : 'border-transparent text-slate-400 hover:bg-slate-805/40 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
