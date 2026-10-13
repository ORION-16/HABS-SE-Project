import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Calendar,
  Clock,
  MoreVertical,
  Search,
  Sparkles,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  Activity,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import RightSidebarWidgets from '../components/RightSidebarWidgets';
import AppointmentChart from '../components/AppointmentChart';
import SlotCalendar from '../components/SlotCalendar';
import CountUp from '../components/react-bits/CountUp';
import SpotlightCard from '../components/react-bits/SpotlightCard';

const Dashboard = () => {
  const { user, role } = useAuth();
  
  // Default doctor: seeded Dr. Sarah Connor
  const [doctorId, setDoctorId] = useState('6acdb9e957a048ea84586412');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-11-10');

  const specialists = [
    {
      id: '6acdb9e957a048ea84586412',
      name: 'Dr. Sarah Connor',
      role: 'Chief Cardiologist',
      score: '98%',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: '6acdba17638d1162bb347804',
      name: 'Dr. Jane Smith',
      role: 'Cardiology Specialist',
      score: '95%',
      avatar: 'https://images.unsplash.com/photo-1594824813629-d5c2136e0d37?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'doc-03',
      name: 'Dr. Michael Chen',
      role: 'Internal Medicine',
      score: '92%',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'doc-04',
      name: 'Dr. Emily Vance',
      role: 'Pediatric Care',
      score: '96%',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const sessions = [
    {
      title: 'Cardiology Diagnostics',
      time: 'Today, 09:00 AM',
      duration: '30 min',
      slots: '6 slots',
      specialty: 'Cardiology',
      doctor: 'Dr. Sarah Connor',
    },
    {
      title: 'Routine Health Consultation',
      time: 'Today, 11:30 AM',
      duration: '30 min',
      slots: '4 slots',
      specialty: 'Internal Medicine',
      doctor: 'Dr. Michael Chen',
    },
    {
      title: 'Specialist Post-Op Review',
      time: 'Tomorrow, 02:00 PM',
      duration: '45 min',
      slots: '2 slots',
      specialty: 'Cardiology',
      doctor: 'Dr. Sarah Connor',
    },
  ];

  return (
    <DashboardLayout
      title={`Greetings, ${user?.name ? user.name.split(' ')[0] : 'Patient'}!`}
      rightPanel={
        <RightSidebarWidgets
          selectedDate={selectedCalendarDate}
          onSelectDate={(d) => setSelectedCalendarDate(d)}
        />
      }
    >
      {/* ─── 1. Top Row: 4 Metric Cards (Matching Screenshot) ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Appointments */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={2} padZero />/<CountUp to={8} padZero />
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Total Appointments</p>
          </div>
        </SpotlightCard>

        {/* Card 2: Clinicians */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#6956e5] shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={8} padZero />/<CountUp to={15} padZero />
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Active Clinicians</p>
          </div>
        </SpotlightCard>

        {/* Card 3: Total Available Slots */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={40} />/<CountUp to={50} />
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Weekly Open Slots</p>
          </div>
        </SpotlightCard>

        {/* Card 4: Daily Patient Cap */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={12} />/<CountUp to={20} />
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Daily Patient Cap</p>
          </div>
        </SpotlightCard>
      </div>

      {/* ─── 2. Middle Row: Specialists List + Chart ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Specialists List (Left: 5 cols) */}
        <div className="lg:col-span-5 habs-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-[#171825] text-base">Verified Specialists</h3>
              <p className="text-xs font-semibold text-[#8e94a5]">Select doctor to view open slots</p>
            </div>
            <span className="text-xs font-bold text-[#6956e5] bg-[#eeebfd] px-2.5 py-1 rounded-full">
              HABS Staff
            </span>
          </div>

          <div className="space-y-3">
            {specialists.map((doc) => {
              const isSelected = doctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setDoctorId(doc.id)}
                  className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#eeebfd] border border-indigo-200 shadow-sm'
                      : 'bg-[#f8f9fd] hover:bg-[#f1f3f9] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-[#171825] leading-tight">
                        {doc.name}
                      </p>
                      <p className="text-[11px] font-semibold text-[#8e94a5] mt-0.5">
                        {doc.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#171825]">{doc.score}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity & Slots Graph (Right: 7 cols) */}
        <div className="lg:col-span-7 habs-card p-5 flex flex-col justify-between">
          <AppointmentChart />
        </div>
      </div>

      {/* ─── 3. Slot Calendar & Booking Interface ───────────────────── */}
      <SlotCalendar doctorId={doctorId} preselectedDate={selectedCalendarDate} />

      {/* ─── 4. Bottom Row: Scheduled Sessions (Teaching Lessons look) */}
      <div className="habs-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-[#171825] text-base">Scheduled Clinic Sessions</h3>
            <p className="text-xs font-semibold text-[#8e94a5]">Daily time windows and ongoing doctor hours</p>
          </div>
          <button className="habs-pill-btn !bg-indigo-50 hover:!bg-indigo-100 !text-indigo-600">
            View All Schedule
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((sess, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-2xl bg-[#f8f9fd] hover:bg-[#f1f3f9] border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
            >
              {/* Left icon & time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#171825]">Start from {sess.time}</p>
                  <p className="text-[11px] font-semibold text-[#8e94a5]">{sess.doctor}</p>
                </div>
              </div>

              {/* Middle details */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-100 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> {sess.duration}
                </span>
                <span className="font-bold text-[#171825]">{sess.specialty}</span>
              </div>

              {/* Right action button */}
              <button className="habs-pill-btn">
                Reminder
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
