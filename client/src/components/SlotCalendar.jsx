import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { getOpenSlots } from '../api/availability.api';
import { bookAppointment } from '../api/appointments.api';
import toast from 'react-hot-toast';

/**
 * SlotCalendar — Patient view for viewing a doctor's available slots.
 * Props:
 *   - doctorId: string (MongoDB ObjectId of the doctor)
 *   - preselectedDate: optional ISO date string
 */
const SlotCalendar = ({ doctorId, preselectedDate = '', onAppointmentBooked }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(preselectedDate || todayStr);
  const [slots, setSlots] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [booking, setBooking] = useState(false);

  const fetchSlots = async (queryDate = date) => {
    if (!doctorId) {
      return;
    }
    if (!queryDate) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await getOpenSlots(doctorId, queryDate);
      if (res.data.success) {
        const slotsData = res.data.data?.slots || res.data.slots || [];
        const blockedData = res.data.data?.blocked ?? res.data.blocked ?? false;
        setSlots(slotsData);
        setBlocked(blockedData);
        setSelectedSlot(null);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch slots';
      console.warn('Could not fetch open slots:', message);
      setSlots([]);
      setBlocked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId && date) {
      fetchSlots(date);
    }
  }, [doctorId, date]);

  const handleBooking = async () => {
    if (!selectedSlot || booking) return;
    setBooking(true);
    try {
      const res = await bookAppointment({ doctorId, date, time: selectedSlot });
      toast.success(res.data?.message || 'Appointment confirmed.');
      setSelectedSlot(null);
      await fetchSlots(date);
      onAppointmentBooked?.(res.data?.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not confirm this appointment.';
      toast.error(message);
      // The slot may have been taken while this patient was deciding.
      if (err.response?.status === 409) await fetchSlots(date);
    } finally {
      setBooking(false);
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
    <div className="space-y-6">
      {/* Date Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="habs-input !pl-12 !h-12 !text-sm"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button
          onClick={() => fetchSlots(date)}
          disabled={loading || !date}
          className="habs-btn-primary shrink-0 !h-12 !px-6 !text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Find Open Slots
            </span>
          )}
        </button>
      </div>

      {hasSearched && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium pb-3 border-b border-slate-100">
          <span>Date: <strong className="text-slate-900 font-bold">{getDayName(date)}</strong></span>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">30-min intervals</span>
        </div>
      )}

      {/* Results Display */}
      {hasSearched && !loading && (
        <AnimatePresence mode="wait">
          {blocked ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-8 rounded-2xl bg-rose-50/70 border border-rose-100 text-center"
            >
              <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-rose-800 text-base">Doctor Unavailable on This Date</p>
              <p className="text-xs sm:text-sm text-rose-600 mt-1 max-w-md mx-auto">
                The doctor has explicitly blocked off this calendar day. Please select another date.
              </p>
            </motion.div>
          ) : slots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center"
            >
              <div className="w-13 h-13 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-slate-800 text-base">No Slots Available</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                The doctor does not have working hours configured on this weekday.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-900">
                  {slots.length} available 30-min window{slots.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Bookable
                </span>
              </div>

              {/* Slot chips grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                  className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">
                        Selected: <span className="text-indigo-600">{selectedSlot}</span> on {getDayName(date)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click confirm to reserve this consultation slot
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBooking}
                    disabled={booking}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
                  >
                    {booking ? 'Confirming…' : 'Confirm Appointment'}
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
