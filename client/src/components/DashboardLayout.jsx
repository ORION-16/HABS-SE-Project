import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  Bell,
  LogOut,
  Stethoscope,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api/auth.api';
import toast from 'react-hot-toast';

/* Sidebar width constant — single source of truth */
const SIDEBAR_W = 72;

const DashboardLayout = ({ children, title = null, subtitle = null }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Proceed even if network error
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutGrid,
      label: role === 'admin' ? 'Admin Portal' : role === 'doctor' ? 'Practice' : 'Appointments',
      visible: true,
    },
    {
      to: '/doctor/availability',
      icon: Calendar,
      label: 'Availability',
      visible: role === 'doctor',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 antialiased text-slate-900">
      {/* ─── Fixed Left Sidebar Dock ────────────────────────── */}
      <aside
        style={{ width: SIDEBAR_W }}
        className="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col items-center justify-between bg-slate-900 border-r border-slate-800 py-6 shadow-lg"
      >
        {/* Brand Logo */}
        <NavLink
          to="/dashboard"
          className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 hover:scale-105 transition-transform"
          title="HABS Healthcare"
        >
          <Stethoscope className="w-5 h-5 text-white" />
        </NavLink>

        {/* Center Nav Icons */}
        <div className="flex flex-col items-center gap-3 my-auto">
          {navItems.map((item) => {
            if (!item.visible) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                
                {/* Tooltip on hover */}
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-40">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Notifications Toggle */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all relative group"
          >
            <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-40">
              Notifications
            </span>
          </button>
        </div>

        {/* Bottom Action: Sign Out */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all relative group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-40">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar (visible below md) ─────────────── */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 px-4 py-3">
        <NavLink
          to="/dashboard"
          className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white"
        >
          <Stethoscope className="w-4 h-4" />
        </NavLink>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            if (!item.visible) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Main Content Shell (guaranteed 72px sidebar clearance on desktop) ─── */}
      <div className="flex flex-col min-h-screen habs-layout-shell">
        {/* Sticky Clean Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-8 lg:px-14 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title || `Welcome, ${user?.name ? user.name.split(' ')[0] : 'User'}`}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3.5 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {user?.name || 'User'}
                  </p>
                  {user?.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  {user?.email}
                </p>
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 px-8 lg:px-14 py-10 lg:py-12 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Notifications Drawer Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-16 right-6 w-80 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 z-50"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Account verified</p>
                  <p className="text-slate-500 mt-0.5">Your email has been verified.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100/50 flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Real-time sync connected</p>
                  <p className="text-slate-500 mt-0.5">Availability updates broadcast live via Socket.io.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
