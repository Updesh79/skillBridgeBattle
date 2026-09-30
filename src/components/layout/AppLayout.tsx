import React, { useState } from 'react';
import { NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  GitPullRequest,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Target,
  Bell,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Layers,
  Flag,
  FileText,
  Swords,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar, LiquidBackground, GlassCard, GlassButton } from '../ui/CommonUI.tsx';

export const SkillBridgeLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 7.5C6 5.84315 7.34315 4.5 9 4.5C10.6569 4.5 12 5.84315 12 7.5C12 9.15685 10.6569 10.5 9 10.5C7.34315 10.5 6 9.15685 6 7.5Z"
      stroke="url(#sb_grad_1)"
      strokeWidth="2"
    />
    <path
      d="M12 16.5C12 14.8431 13.3431 13.5 15 13.5C16.6569 13.5 18 14.8431 18 16.5C18 18.1569 16.6569 19.5 15 19.5C13.3431 19.5 12 18.1569 12 16.5Z"
      stroke="url(#sb_grad_2)"
      strokeWidth="2"
    />
    <path
      d="M16.5 6C17.8807 6 19 7.11929 19 8.5C19 9.88071 17.8807 11 16.5 11C15.1193 11 14 9.88071 14 8.5C14 7.11929 15.1193 6 16.5 6Z"
      fill="url(#sb_grad_1)"
      fillOpacity="0.35"
      stroke="url(#sb_grad_2)"
      strokeWidth="1.75"
    />
    <path
      d="M7.5 13C8.88071 13 10 14.1193 10 15.5C10 16.8807 8.88071 18 7.5 18C6.11929 18 5 16.8807 5 15.5C5 14.1193 6.11929 13 7.5 13Z"
      fill="url(#sb_grad_2)"
      fillOpacity="0.35"
      stroke="url(#sb_grad_1)"
      strokeWidth="1.75"
    />
    <path
      d="M11.2 9.5L14.3 9.0M9.7 14.5L12.8 14.9M11.1 9.8L13.1 14.1"
      stroke="rgba(255,255,255,0.75)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="sb_grad_1" x1="5" y1="4.5" x2="19" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="0.5" stopColor="#6366F1" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="sb_grad_2" x1="19" y1="4.5" x2="5" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#C026D3" />
      </linearGradient>
    </defs>
  </svg>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading, pendingVerification } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col items-center gap-3.5 glass-level-2 px-8 py-7 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/40 via-indigo-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center animate-pulse">
            <SkillBridgeLogoIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-white/75 tracking-tight">
            Initializing SkillBridge Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (pendingVerification && !profile) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center relative overflow-hidden">
        <LiquidBackground />
        <p className="relative z-10 text-sm font-medium text-white/70">
          Verifying administrator privileges...
        </p>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <LiquidBackground />
        <GlassCard level={3} className="relative z-10 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-300 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-rose-400">
            Error 403 • Forbidden
          </span>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
            Administrator Access Required
          </h1>
          <p className="text-sm text-white/65 mt-2 leading-relaxed">
            Your account has the <strong className="text-white">STUDENT</strong> role. Only
            authorized administrators can access the platform management console.
          </p>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full"
          >
            Return to Student Dashboard
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, unreadNotifications, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Top Floating Liquid Glass Navbar primary items
  const topNavbarLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/discover', label: 'Discover' },
    { to: '/battle', label: 'Skill Battle' },
    { to: '/connections', label: 'Connections' },
    { to: '/messages', label: 'Messages' },
    { to: '/sessions', label: 'Sessions' },
    { to: '/goals', label: 'Goals' },
    { to: '/progress', label: 'Progress' },
  ];

  // Full Sidebar Navigation preserving every route
  const studentNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover Peers', icon: Compass },
    { to: '/battle', label: 'Skill Battle', icon: Swords },
    { to: '/my-skills', label: 'My Skills', icon: BookOpen },
    { to: '/requests', label: 'Learning Requests', icon: GitPullRequest },
    { to: '/connections', label: 'Connections', icon: Users },
    { to: '/sessions', label: 'Sessions', icon: Calendar },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/goals', label: 'Learning Goals', icon: Target },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/prd', label: 'Project PRD', icon: FileText },
  ];

  const adminNav = [
    { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck, end: true },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/skills', label: 'Manage Skills', icon: BookOpen },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/sessions', label: 'All Sessions', icon: Calendar },
    { to: '/admin/reports', label: 'User Reports', icon: Flag },
    { to: '/admin/settings', label: 'Platform Docs & Viva', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderSidebarLinks = (onClickItem?: () => void) => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase mb-2.5">
            Student Workspace
          </p>
          <nav className="space-y-1">
            {studentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClickItem}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-blue-600/15 text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                        : 'text-white/65 hover:text-white hover:bg-white/[0.05] border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400 absolute left-1" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-cyan-300' : 'text-white/50 group-hover:text-white/80'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/25 text-cyan-200 border border-cyan-400/30">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {profile?.role === 'ADMIN' && (
          <div>
            <p className="px-3 text-[11px] font-semibold tracking-wider text-cyan-300/80 uppercase mb-2.5">
              Administration
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClickItem}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/20 to-indigo-600/15 text-white border border-cyan-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                          : 'text-white/65 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-cyan-300/80" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-white/10 mt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-400/25 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col relative">
      <LiquidBackground />

      {/* Sticky Floating Rounded Frosted Glass Navbar */}
      <div className="sticky top-0 z-30 px-3 sm:px-6 pt-3 pb-1">
        <header className="max-w-[1440px] mx-auto h-15 rounded-2xl glass-level-2 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/35 via-indigo-600/30 to-cyan-500/35 border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] group-hover:border-white/35 transition-all">
                <SkillBridgeLogoIcon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold tracking-tight text-white">
                  SkillBridge
                </span>
                <span className="hidden xl:inline-block text-[11px] text-white/45 border-l border-white/15 pl-2.5">
                  Micro-Skill Exchange
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center Floating Navigation Bar Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            {topNavbarLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 via-indigo-600/25 to-blue-600/25 text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                    <span>{item.label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right User & Notification Controls */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-white/75 hover:text-white transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-white/30">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {profile && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-left"
              >
                <Avatar name={profile.fullName} src={profile.avatarUrl} size="sm" />
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">
                      {profile.fullName}
                    </p>
                    {profile.role === 'ADMIN' && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/45 mt-0.5 truncate max-w-[130px]">
                    {profile.college || profile.email}
                  </p>
                </div>
              </button>
            )}
          </div>
        </header>
      </div>

      {/* Main Workspace Container */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 gap-6 relative z-10">
        {/* Desktop Floating Glass Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-22 glass-level-1 rounded-2xl p-4 h-[calc(100vh-6.5rem)] overflow-y-auto">
            {renderSidebarLinks()}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] glass-level-3 h-full p-5 overflow-y-auto z-10 flex flex-col justify-between border-r border-white/15">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center">
                      <SkillBridgeLogoIcon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white tracking-tight">SkillBridge</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {renderSidebarLinks(() => setMobileOpen(false))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 pb-10 animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  );
};
