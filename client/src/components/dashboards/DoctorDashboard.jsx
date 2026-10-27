import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Ban,
  Clock3,
  Users,
  Sliders,
  UserRound,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAvailability } from '../../api/availability.api';
import { getMyAppointments } from '../../api/appointments.api';
import useSocket from '../../hooks/useSocket';

const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const doctorId = user?.id;

  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    const fetchMyAvailability = async () => {
      if (!doctorId) return;
      try {
        const res = await getAvailability(doctorId);
        if (res.data?.success && res.data.data) {
          setAvailability(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load doctor schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAvailability();
  }, [doctorId]);

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) return;
    setLoadingAppointments(true);
    try {
      const res = await getMyAppointments();
      if (res.data?.success) setAppointments(res.data.data || []);
    } catch (err) {
      console.warn('Could not load booked appointments:', err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleAppointmentUpdated = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useSocket(doctorId, undefined, handleAppointmentUpdated);

  const activeDaysCount = availability?.weeklySlots
    ? new Set(availability.weeklySlots.map((s) => s.dayOfWeek)).size
    : 0;

  const blockedDatesCount = availability?.blockedDates?.length || 0;

  return (
    <div className="habs-dashboard-container">
      {/* ─── 1. Top KPI Summary Cards ──────────────────────────────── */}
      <div className="habs-kpi-grid">
        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Days</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeDaysCount} Days / wk</p>
            <p className="text-xs text-emerald-600 font-semibold">Recurring schedule</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Patient Limit</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{availability?.dailyCap || 20} max</p>
            <p className="text-xs text-slate-500 font-medium">Consultations cap</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Dates</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{blockedDatesCount} Dates</p>
            <p className="text-xs text-amber-600 font-semibold">Holidays & leave</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Ban className="w-6 h-6" />
          </div>
        </div>

        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Sync</p>
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{appointments.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total confirmed bookings</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── 2. Schedule Overview & Booked Patients ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Weekly Schedule (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
              <p className="text-xs text-slate-500 mt-1">Recurring consultation hours</p>
            </div>
            <Link
              to="/doctor/availability"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Schedule</span>
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-xs text-slate-400 py-6">Loading schedule...</p>
          ) : availability?.weeklySlots && availability.weeklySlots.length > 0 ? (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
              {availability.weeklySlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {DAYS_MAP[slot.dayOfWeek]?.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {DAYS_MAP[slot.dayOfWeek]}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs text-slate-500">No working hours configured yet.</p>
              <Link
                to="/doctor/availability"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs"
              >
                Set Working Hours
              </Link>
            </div>
          )}

          {/* Blocked Dates List */}
          {blockedDatesCount > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Blocked Holiday Dates:</p>
              <div className="flex flex-wrap gap-1.5">
                {availability.blockedDates.map((bDate, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100"
                  >
                    <Ban className="w-3 h-3 text-rose-500" />
                    {new Date(bDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Doctor-only booking schedule (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Booked Appointments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                See the patients who have confirmed a consultation with you
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">All upcoming confirmed consultations</p>
            <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              {appointments.length} confirmed
            </span>
          </div>

          {loadingAppointments ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading appointments…</p>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-100">
              <UserRound className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">No appointments booked</p>
              <p className="text-xs text-slate-500 mt-1">Confirmed patient bookings will appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <div className="w-15 h-15 rounded-xl bg-indigo-600 text-white shrink-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold">{appointment.time}</span>
                    <span className="text-[10px] opacity-80">30 min</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-bold text-slate-900">{appointment.patient?.name || 'Patient'}</p>
                      <span className="text-xs font-semibold text-indigo-700">{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      {appointment.patient?.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{appointment.patient.email}</span>}
                      {appointment.patient?.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{appointment.patient.phone}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full self-start sm:self-auto">Confirmed</span>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;
