import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Inbox
} from 'lucide-react';
import { getOpenSlots } from '../api/availability.api';
import toast from 'react-hot-toast';

/**
 * SlotCalendar — Patient view for viewing a doctor's available slots.
 * Props:
 *   - doctorId: string (MongoDB ObjectId of the doctor)
 *   - preselectedDate: optional ISO date string
 */
const SlotCalendar = ({ doctorId, preselectedDate = '' }) => {
  const [date, setDate] = useState(preselectedDate || '2026-11-10');
  const [slots, setSlots] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSlots = async () => {
    if (!doctorId) {
      toast.error('Please specify a Doctor ID');
      return;
    }
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await getOpenSlots(doctorId, date);
      if (res.data.success) {
        const slotsData = res.data.data?.slots || res.data.slots || [];
        const blockedData = res.data.data?.blocked ?? res.data.blocked ?? false;
        setSlots(slotsData);
        setBlocked(blockedData);
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
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }
    return dateStr;
  };

  return (
    <div className="habs-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f3f9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#eeebfd] text-[#6956e5] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#171825] text-base">Select Consultation Slot</h3>
            <p className="text-xs font-semibold text-[#8e94a5]">30-minute intervals aligned with doctor cap</p>
          </div>
        </div>

        {hasSearched && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {getDayName(date)}
          </span>
        )}
      </div>

      {/* Date Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="habs-input !pl-10"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button
          onClick={fetchSlots}
          disabled={loading || !date}
          className="habs-btn-primary shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Find Open Slots
            </span>
          )}
        </button>
      </div>

      {/* Results Display */}
      {hasSearched && !loading && (
        <AnimatePresence mode="wait">
          {blocked ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-6 rounded-2xl bg-rose-50/70 border border-rose-100 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-rose-800 text-sm">Doctor Unavailable on This Date</p>
              <p className="text-xs text-rose-600 mt-1">
                The doctor has explicitly blocked off this calendar day. Please select another date.
              </p>
            </motion.div>
          ) : slots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-slate-800 text-sm">No Slots Available</p>
              <p className="text-xs text-slate-500 mt-1">
                The doctor does not have working hours configured on this weekday.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#171825]">
                  {slots.length} available 30-min window{slots.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bookable
                </span>
              </div>

              {/* Slot chips grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`habs-slot-chip ${isSelected ? 'selected' : ''}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Selected Slot Confirmation Card */}
              {selectedSlot && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-[#f0edfe] border border-indigo-100 flex items-center justify-between flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-300">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#171825] text-xs">
                        Selected: <span className="text-[#6956e5]">{selectedSlot}</span> on {getDayName(date)}
                      </p>
                      <p className="text-[11px] text-[#8e94a5] mt-0.5">
                        Module 3 will process instant patient booking confirmation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`Selected ${selectedSlot} on ${getDayName(date)}`)}
                    className="habs-pill-btn !py-2 !px-4 !bg-[#6956e5] !text-white"
                  >
                    Confirm Selection
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default SlotCalendar;
