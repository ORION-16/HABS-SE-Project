import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Save,
  Ban,
  CalendarCheck,
  Activity,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { setAvailability, blockDates, unblockDates, getAvailability } from '../api/availability.api';
import DashboardLayout from '../components/DashboardLayout';
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
  const onAvailabilityUpdated = useCallback(() => {
    setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success('Availability synced via real-time channel');
  }, []);

  useSocket(doctorId, onAvailabilityUpdated);

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

  const addSlot = (dayOfWeek) => {
    setWeeklySlots((prev) => [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeSlot = (index) => {
    setWeeklySlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    setWeeklySlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveSlots = async () => {
    setSaving(true);
    try {
      const res = await setAvailability({
        weeklySlots,
        dailyCap,
      });
      if (res.data.success) {
        toast.success('Schedule saved successfully');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save schedule';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDate = async () => {
    if (!newBlockDate) {
      toast.error('Please select a date to block');
      return;
    }
    try {
      const res = await blockDates({ dates: [newBlockDate] });
      if (res.data.success) {
        setBlockedDatesList((prev) => [...new Set([...prev, newBlockDate])]);
        setNewBlockDate('');
        toast.success(`Blocked date ${newBlockDate}`);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to block date';
      toast.error(message);
    }
  };

  const handleUnblockDate = async (dateStr) => {
    try {
      const res = await unblockDates({ dates: [dateStr] });
      if (res.data.success) {
        setBlockedDatesList((prev) => prev.filter((d) => d !== dateStr));
        toast.success(`Unblocked date ${dateStr}`);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to unblock date';
      toast.error(message);
    }
  };

  const slotsByDay = DAYS.map((dayName, dayIndex) => ({
    day: dayName,
    dayIndex,
    slots: weeklySlots
      .map((slot, originalIndex) => ({ ...slot, originalIndex }))
      .filter((s) => s.dayOfWeek === dayIndex),
  }));

  const activeDaysCount = slotsByDay.filter((d) => d.slots.length > 0).length;

  if (loading) {
    return (
      <DashboardLayout title="Availability Management">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Availability Management"
      subtitle="Configure recurring consultation hours and date overrides"
    >
      <div className="habs-dashboard-container">
        {/* ─── 1. Top Stat Cards ────────────────────────────────────── */}
        <div className="habs-kpi-grid">
          <div className="habs-kpi-card">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Days</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeDaysCount} / 7</p>
              <p className="text-xs text-slate-500 font-medium">Working days</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="habs-kpi-card">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Windows</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{weeklySlots.length}</p>
              <p className="text-xs text-slate-500 font-medium">Time intervals</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="habs-kpi-card">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Patient Limit</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{dailyCap}</p>
              <p className="text-xs text-slate-500 font-medium">Max patients/day</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="habs-kpi-card">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Dates</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{blockedDatesList.length}</p>
              <p className="text-xs text-amber-600 font-semibold">Holidays & leaves</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ─── 2. Real-Time Sync Indicator ──────────────────────────── */}
        <div className="habs-panel p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
            <p className="text-sm font-bold text-slate-800">
              Real-time schedule synchronization active
            </p>
          </div>
          {lastSynced && (
            <span className="text-xs font-semibold text-slate-400">
              Last updated: {lastSynced}
            </span>
          )}
        </div>

        {/* ─── 3. Weekly Schedule Configuration Grid ────────────────── */}
        <div className="habs-panel p-7 sm:p-8 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Practice Schedule</h2>
              <p className="text-xs text-slate-500 mt-1">Specify active consultation windows for each day of the week</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-bold text-slate-600">Daily Cap:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={dailyCap}
                  onChange={(e) => setDailyCap(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-11 rounded-xl border border-slate-200 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveSlots}
                disabled={saving}
                className="habs-btn-primary !h-11 !px-6 !text-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
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
                  className={`p-4 rounded-xl border transition-all ${
                    hasSlots
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${hasSlots ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {day}
                      </h3>
                    </div>
                    <button
                      onClick={() => addSlot(dayIndex)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Window
                    </button>
                  </div>

                  {slots.length === 0 ? (
                    <p className="text-xs text-slate-400 pl-4 py-1">No working hours scheduled (Off)</p>
                  ) : (
                    <div className="space-y-2 mt-2 pl-4">
                      {slots.map((slot) => (
                        <div
                          key={slot.originalIndex}
                          className="flex items-center gap-3 flex-wrap"
                        >
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                              className="bg-transparent font-medium text-xs text-slate-800 outline-none"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                              className="bg-transparent font-medium text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removeSlot(slot.originalIndex)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                            title="Remove window"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* ─── 4. Block Specific Dates ───────────────────────────────── */}
        <div className="habs-panel p-7 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Block Specific Dates</h2>
            <p className="text-xs text-slate-500 mt-0.5">Dates added here will immediately hide all open slots from patient calendars</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
            <p className="text-xs text-slate-400 py-1">No blocked dates scheduled</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {blockedDatesList.sort().map((dateStr) => (
                <div
                  key={dateStr}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700"
                >
                  <span>🚫 {dateStr}</span>
                  <button
                    onClick={() => handleUnblockDate(dateStr)}
                    className="w-4 h-4 rounded-full bg-rose-200/60 hover:bg-rose-300 text-rose-800 flex items-center justify-center transition-colors text-[10px]"
                    title="Unblock date"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
