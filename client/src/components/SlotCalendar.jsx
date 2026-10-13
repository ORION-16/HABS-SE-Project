import { useState } from 'react';
import { getOpenSlots } from '../api/availability.api';
import toast from 'react-hot-toast';

/**
 * SlotCalendar — Patient view for viewing a doctor's available slots.
 * Props:
 *   - doctorId: string (MongoDB ObjectId of the doctor)
 */
const SlotCalendar = ({ doctorId }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSlots = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await getOpenSlots(doctorId, date);
      if (res.data.success) {
        setSlots(res.data.data.slots);
        setBlocked(res.data.data.blocked);
        setSelectedSlot(null);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch slots';
      toast.error(message);
      setSlots([]);
      setBlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-[var(--habs-text)] mb-4 flex items-center gap-2">
        <span className="text-xl">📅</span>
        Available Slots
      </h3>

      {/* Date picker */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label className="label-habs">Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-habs"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchSlots}
            disabled={loading || !date}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <span className="animate-pulse-glow">Searching...</span>
            ) : (
              'Find Slots'
            )}
          </button>
        </div>
      </div>

      {/* Date display */}
      {date && hasSearched && (
        <p className="text-sm text-[var(--habs-text-muted)] mb-4">
          {getDayName(date)}
        </p>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <div className="animate-fade-in">
          {blocked ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🚫</div>
              <p className="text-[var(--habs-danger)] font-medium">
                Doctor unavailable on this date
              </p>
              <p className="text-sm text-[var(--habs-text-muted)] mt-1">
                This date has been blocked. Please select another date.
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[var(--habs-text-muted)] font-medium">
                No slots available
              </p>
              <p className="text-sm text-[var(--habs-text-muted)] mt-1">
                The doctor has no availability on this day.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--habs-text-muted)] mb-3">
                {slots.length} slot{slots.length !== 1 ? 's' : ''} available
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                    className={`slot-chip ${selectedSlot === slot ? 'selected' : ''}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {selectedSlot && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--habs-primary)]/10 border border-[var(--habs-primary)]/25">
                  <p className="text-sm text-[var(--habs-primary-light)]">
                    ✅ Selected: <strong>{selectedSlot}</strong> on {getDayName(date)}
                  </p>
                  <p className="text-xs text-[var(--habs-text-muted)] mt-1">
                    Booking functionality coming in Module 3
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotCalendar;
