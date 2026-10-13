import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Save,
  Ban,
  CheckCircle2,
  Copy,
  Radio,
  Sparkles,
  AlertCircle,
  MoreVertical,
  Activity,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { setAvailability, blockDates, unblockDates, getAvailability } from '../api/availability.api';
import DashboardLayout from '../components/DashboardLayout';
import RightSidebarWidgets from '../components/RightSidebarWidgets';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import CountUp from '../components/react-bits/CountUp';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorAvailability = () => {
  const { user } = useAuth();
  const doctorId = user?.id;

  const [weeklySlots, setWeeklySlots] = useState([]);
  const [dailyCap, setDailyCap] = useState(20);
  const [blockedDatesList, setBlockedDatesList] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);

  // Real-time Socket.io updates listener
  const onAvailabilityUpdated = useCallback((data) => {
    setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    toast.success('⚡ Availability synced via Socket.io', {
      icon: '🔄',
      style: { borderRadius: '1rem', background: '#14151b', color: '#fff' },
    });
  }, []);

  useSocket(doctorId, onAvailabilityUpdated);

  // Load existing availability
  useEffect(() => {
    const loadAvailability = async () => {
      if (!doctorId) return;
      try {
        const res = await getAvailability(doctorId);
        if (res.data.success && res.data.data) {
          const avail = res.data.data;
          setWeeklySlots(avail.weeklySlots || []);
          setDailyCap(avail.dailyCap || 20);
          setBlockedDatesList(
            (avail.blockedDates || []).map((d) => new Date(d).toISOString().split('T')[0])
          );
        }
      } catch {
        // Fresh schedule
      } finally {
        setLoading(false);
      }
    };
    loadAvailability();
  }, [doctorId]);

  // ─── Slot Management ──────────────────────────────────────────
  const addSlot = (dayOfWeek) => {
    setWeeklySlots((prev) => [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeSlot = (originalIndex) => {
    setWeeklySlots((prev) => prev.filter((_, i) => i !== originalIndex));
  };

  const updateSlot = (originalIndex, field, value) => {
    setWeeklySlots((prev) =>
      prev.map((slot, i) => (i === originalIndex ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveSlots = async () => {
    if (weeklySlots.length === 0) {
      toast.error('Add at least one slot');
      return;
    }

    for (const slot of weeklySlots) {
      if (slot.startTime >= slot.endTime) {
        toast.error(`Invalid slot on ${DAYS[slot.dayOfWeek]}: startTime must be before endTime`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await setAvailability({
        weeklySlots: weeklySlots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        dailyCap,
      });

      if (res.data.success) {
        toast.success('Availability saved and published!');
        setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  // ─── Block Date Management ────────────────────────────────────
  const handleBlockDate = async () => {
    if (!newBlockDate) return;

    try {
      const res = await blockDates({ dates: [newBlockDate] });
      if (res.data.success) {
        setBlockedDatesList((prev) => [...new Set([...prev, newBlockDate])]);
        setNewBlockDate('');
        toast.success('Date blocked successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block date');
    }
  };

  const handleUnblockDate = async (date) => {
    try {
      const res = await unblockDates({ dates: [date] });
      if (res.data.success) {
        setBlockedDatesList((prev) => prev.filter((d) => d !== date));
        toast.success('Date unblocked');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock date');
    }
  };

  const copyDoctorId = () => {
    if (doctorId) {
      navigator.clipboard.writeText(doctorId);
      toast.success('Doctor ID copied to clipboard');
    }
  };

  // Group slots by day of week
  const slotsByDay = DAYS.map((_, dayIndex) => ({
    day: DAYS[dayIndex],
    dayIndex,
    slots: weeklySlots
      .map((slot, originalIndex) => ({ ...slot, originalIndex }))
      .filter((slot) => slot.dayOfWeek === dayIndex),
  }));

  const activeDaysCount = slotsByDay.filter((d) => d.slots.length > 0).length;

  if (loading) {
    return (
      <DashboardLayout title="Doctor Availability">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Availability Management"
      subtitle="Configure weekly consultation slots and date overrides"
      rightPanel={<RightSidebarWidgets />}
    >
      {/* ─── 1. Top Stat Cards (Matching Screenshot) ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Active Days */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={activeDaysCount} padZero />/07
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Active Workdays</p>
          </div>
        </SpotlightCard>

        {/* Card 2: Total Time Windows */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={weeklySlots.length} padZero /> Slots
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Configured Windows</p>
          </div>
        </SpotlightCard>

        {/* Card 3: Daily Cap */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={dailyCap} /> Cap
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Patients Per Day</p>
          </div>
        </SpotlightCard>

        {/* Card 4: Blocked Dates */}
        <SpotlightCard className="habs-stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
              <Ban className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
              <CountUp to={blockedDatesList.length} padZero /> Days
            </h4>
            <p className="text-xs font-semibold text-[#8e94a5] mt-0.5">Blocked Dates</p>
          </div>
        </SpotlightCard>
      </div>

      {/* ─── 2. Real-Time Sync Bar & Doctor ID Share ─────────────── */}
      <div className="habs-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-indigo-50/20 to-white">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <p className="text-xs font-bold text-[#171825]">
            Socket.io Live Room: <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">doctor:{doctorId}</code>
          </p>
          {lastSynced && (
            <span className="text-[11px] font-semibold text-[#8e94a5]">
              (Last synced: {lastSynced})
            </span>
          )}
        </div>

        <button
          onClick={copyDoctorId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <Copy className="w-3.5 h-3.5" /> Copy ID for Patients
        </button>
      </div>

      {/* ─── 3. Weekly Schedule Configuration Grid ───────────────── */}
      <div className="habs-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#f1f3f9]">
          <div>
            <h3 className="font-extrabold text-[#171825] text-base">Weekly Practice Schedule</h3>
            <p className="text-xs font-semibold text-[#8e94a5]">Add start & end times for each day of the week</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Daily Cap:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={dailyCap}
                onChange={(e) => setDailyCap(Math.max(1, parseInt(e.target.value) || 1))}
                className="habs-input !w-20 !py-1.5 !px-2.5 text-center font-bold"
              />
            </div>

            <button
              onClick={handleSaveSlots}
              disabled={saving}
              className="habs-btn-primary !py-2 !px-4"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> Save Schedule
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="space-y-3">
          {slotsByDay.map(({ day, dayIndex, slots }) => {
            const hasSlots = slots.length > 0;
            return (
              <div
                key={dayIndex}
                className={`p-4 rounded-2xl border transition-all ${
                  hasSlots
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#f8f9fd] border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${hasSlots ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    <h4 className="text-xs font-extrabold text-[#171825] uppercase tracking-wider">
                      {day}
                    </h4>
                  </div>
                  <button
                    onClick={() => addSlot(dayIndex)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slot
                  </button>
                </div>

                {slots.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 italic pl-4">No hours scheduled (Off duty)</p>
                ) : (
                  <div className="space-y-2 mt-2 pl-4">
                    {slots.map((slot) => (
                      <div
                        key={slot.originalIndex}
                        className="flex items-center gap-2.5 flex-wrap"
                      >
                        <div className="flex items-center gap-2 bg-[#f4f5fa] p-1.5 px-3 rounded-xl border border-slate-200">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                            className="bg-transparent font-bold text-xs text-[#171825] outline-none"
                          />
                          <span className="text-xs font-bold text-[#8e94a5]">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                            className="bg-transparent font-bold text-xs text-[#171825] outline-none"
                          />
                        </div>
                        <button
                          onClick={() => removeSlot(slot.originalIndex)}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                          title="Remove window"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Block Specific Dates ─────────────────────────────── */}
      <div className="habs-card p-5 sm:p-6">
        <div className="mb-4">
          <h3 className="font-extrabold text-[#171825] text-base">Date Blockers (Absences & Holidays)</h3>
          <p className="text-xs font-semibold text-[#8e94a5]">Blocked dates will immediately hide all open slots from patient calendars</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="habs-input !pl-10"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button
            onClick={handleBlockDate}
            disabled={!newBlockDate}
            className="habs-btn-primary shrink-0"
          >
            <Ban className="w-4 h-4" /> Block Date
          </button>
        </div>

        {blockedDatesList.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 italic">No blocked dates scheduled</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {blockedDatesList.sort().map((dateStr) => (
              <div
                key={dateStr}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700"
              >
                <span>🚫 {dateStr}</span>
                <button
                  onClick={() => handleUnblockDate(dateStr)}
                  className="w-4 h-4 rounded-full bg-rose-200/60 hover:bg-rose-300 text-rose-800 flex items-center justify-center transition-colors"
                  title="Unblock date"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
