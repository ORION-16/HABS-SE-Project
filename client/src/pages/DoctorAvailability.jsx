import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { setAvailability, blockDates, unblockDates, getAvailability } from '../api/availability.api';
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

  // Socket.io listener
  const onAvailabilityUpdated = useCallback((data) => {
    toast.success('✅ Availability synced in real-time');
  }, []);

  useSocket(doctorId, onAvailabilityUpdated);

  // Load existing availability on mount
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
        // No availability yet — start fresh
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

  const removeSlot = (index) => {
    setWeeklySlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    setWeeklySlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveSlots = async () => {
    if (weeklySlots.length === 0) {
      toast.error('Add at least one slot');
      return;
    }

    // Validate all slots
    for (const slot of weeklySlots) {
      if (slot.startTime >= slot.endTime) {
        toast.error(`Invalid slot on ${DAYS[slot.dayOfWeek]}: start time must be before end time`);
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
        toast.success('Availability saved!');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save availability';
      toast.error(message);
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
        toast.success('Date blocked');
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

  // ─── Group slots by day ────────────────────────────────────────
  const slotsByDay = DAYS.map((_, dayIndex) => ({
    day: DAYS[dayIndex],
    dayIndex,
    slots: weeklySlots
      .map((slot, originalIndex) => ({ ...slot, originalIndex }))
      .filter((slot) => slot.dayOfWeek === dayIndex),
  }));

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-animated">
        <div className="animate-pulse-glow text-xl text-[var(--habs-text-muted)]">Loading availability...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-animated py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--habs-text)] flex items-center gap-2">
                <span>🩺</span> Manage Availability
              </h1>
              <p className="text-sm text-[var(--habs-text-muted)] mt-1">
                Set your weekly schedule and block specific dates
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="label-habs">Daily Patient Cap</label>
                <input
                  type="number"
                  value={dailyCap}
                  onChange={(e) => setDailyCap(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={100}
                  className="input-habs !w-24 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Slots Grid */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--habs-text)]">📋 Weekly Schedule</h2>
            <button onClick={handleSaveSlots} disabled={saving} className="btn-primary">
              {saving ? <span className="animate-pulse-glow">Saving...</span> : '💾 Save Schedule'}
            </button>
          </div>

          <div className="space-y-4">
            {slotsByDay.map(({ day, dayIndex, slots }) => (
              <div
                key={dayIndex}
                className="p-4 rounded-lg border border-[var(--habs-border)] bg-[var(--habs-bg)]/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[var(--habs-text)]">{day}</h3>
                  <button
                    onClick={() => addSlot(dayIndex)}
                    className="btn-secondary !py-1 !px-3 !text-xs"
                  >
                    + Add Slot
                  </button>
                </div>

                {slots.length === 0 ? (
                  <p className="text-sm text-[var(--habs-text-muted)] italic">No slots set</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.originalIndex}
                        className="flex items-center gap-3 flex-wrap"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                            className="input-habs !w-32 text-center !text-sm"
                          />
                          <span className="text-[var(--habs-text-muted)]">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                            className="input-habs !w-32 text-center !text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removeSlot(slot.originalIndex)}
                          className="btn-danger !py-1 !px-2 !text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-[var(--habs-text)] mb-4">🚫 Blocked Dates</h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="input-habs flex-1"
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={handleBlockDate}
              disabled={!newBlockDate}
              className="btn-primary"
            >
              Block Date
            </button>
          </div>

          {blockedDatesList.length === 0 ? (
            <p className="text-sm text-[var(--habs-text-muted)] italic">No dates blocked</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blockedDatesList.sort().map((date) => (
                <div
                  key={date}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--habs-danger)]/10 border border-[var(--habs-danger)]/25"
                >
                  <span className="text-sm text-[var(--habs-danger)]">{date}</span>
                  <button
                    onClick={() => handleUnblockDate(date)}
                    className="text-[var(--habs-danger)] hover:text-[var(--habs-text)] transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor ID for sharing */}
        <div className="glass-card p-4 animate-fade-in">
          <p className="text-xs text-[var(--habs-text-muted)]">
            📌 Your Doctor ID: <code className="text-[var(--habs-primary-light)] bg-[var(--habs-bg)]/60 px-2 py-0.5 rounded">{doctorId}</code>
            <span className="ml-2">— Share this with patients so they can view your availability.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
