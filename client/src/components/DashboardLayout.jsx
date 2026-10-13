import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  Clock,
  Users,
  Bell,
  Settings,
  LogOut,
  Stethoscope,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api/auth.api';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children, title = null, subtitle = null, rightPanel = null }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutGrid,
      label: 'Overview',
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
    <div className="min-h-screen bg-[#eceef7] p-2 sm:p-4 md:p-6 lg:p-7 flex justify-center items-stretch antialiased selection:bg-indigo-500 selection:text-white">
      {/* Outer Executive Canvas */}
      <div className="w-full max-w-[1580px] bg-[#f9fafc] rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] border border-[#e7eaf4] shadow-[0_20px_50px_-12px_rgba(20,24,45,0.06)] flex flex-col md:flex-row p-3 sm:p-5 lg:p-6 gap-4 sm:gap-6 lg:gap-7 overflow-hidden">
        
        {/* ─── Left Dock Sidebar (Matching Screenshot) ────────────── */}
        <aside className="w-full md:w-20 lg:w-[84px] bg-[#14151b] rounded-[24px] sm:rounded-[30px] p-3 md:py-6 md:px-3 flex md:flex-col items-center justify-between shrink-0 shadow-xl shadow-slate-950/20 z-20">
          {/* Logo Mark */}
          <div className="flex items-center gap-3 md:flex-col">
            <NavLink
              to="/"
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6956e5] via-[#7d67f5] to-[#9a87fc] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30 hover:scale-105 transition-transform"
              title="HABS Healthcare"
            >
              <Stethoscope className="w-6 h-6 text-white" />
            </NavLink>
          </div>

          {/* Nav Icons Stack */}
          <div className="flex md:flex-col items-center gap-2 md:gap-3 my-auto">
            {navItems.map((item) => {
              if (!item.visible) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`habs-dock-btn relative group ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  
                  {/* Tooltip on hover */}
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-30">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}

            {/* Patients / Doctors Directory Shortcut */}
            <button
              onClick={() => navigate('/dashboard')}
              title="Directory"
              className="habs-dock-btn group relative"
            >
              <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-30">
                Directory
              </span>
            </button>

            {/* Notifications Toggle */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              className="habs-dock-btn group relative"
            >
              <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-[#14151b]" />
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-30">
                Notifications
              </span>
            </button>
          </div>

          {/* Bottom Dock Action: Logout */}
          <div className="flex md:flex-col items-center gap-2">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="habs-dock-btn hover:!bg-red-500/20 hover:!text-red-400 group relative"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-30">
                Sign Out
              </span>
            </button>
          </div>
        </aside>

        {/* ─── Main Content Shell ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          {/* Header Row (Exact Screenshot style) */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 pt-1 px-1 border-b border-[#edf0f8]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
                {title || `Greetings, ${user?.name ? user.name.split(' ')[0] : 'User'}!`}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#8e94a5] mt-0.5">
                {subtitle || todayFormatted}
              </p>
            </div>

            {/* Header Right: Notifications + User Badge */}
            <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
              {/* Notification Bell Button */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-white border border-[#e7eaf4] shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white" />
              </button>

              {/* User Avatar & Name Card */}
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-white border border-[#e7eaf4] shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6956e5] to-[#8d7df5] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#171825] leading-none group-hover:text-indigo-600 transition-colors">
                      {user?.name || 'Authorized User'}
                    </p>
                    {user?.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-[#8e94a5] leading-none mt-1">
                    {user?.email || 'patient@habs.com'}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#eeebfd] text-[#6956e5] hidden lg:inline-block">
                  {role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8e94a5] group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          </header>

          {/* Main Body Area (Two Column Split: Center Content + Right Widgets) */}
          <div className="flex-1 flex flex-col xl:flex-row gap-5 lg:gap-6 pt-5 overflow-y-auto">
            {/* Center Area (Main Cards & Grid) */}
            <main className="flex-1 min-w-0 flex flex-col gap-5 lg:gap-6">
              {children}
            </main>

            {/* Right Panel (Mini Calendar, Upcoming, Notes) */}
            {rightPanel && (
              <aside className="w-full xl:w-[360px] 2xl:w-[380px] shrink-0 flex flex-col gap-5">
                {rightPanel}
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Drawer Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-20 right-8 w-80 sm:w-96 bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 z-50"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/50 flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Real-time sync connected</p>
                  <p className="text-gray-500 mt-0.5">Socket.io channel is active for doctor availability.</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">Just now</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Account verified</p>
                  <p className="text-gray-500 mt-0.5">Your email has been verified with JWT credentials.</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">Today</span>
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
