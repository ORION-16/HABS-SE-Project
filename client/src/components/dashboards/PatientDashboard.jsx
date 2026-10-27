import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Stethoscope,
  Mail,
  User,
  CalendarCheck2,
  Clock3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDoctors } from '../../api/auth.api';
import { getMyAppointments } from '../../api/appointments.api';
import SlotCalendar from '../SlotCalendar';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    const fetchApprovedDoctors = async () => {
      try {
        const res = await getDoctors();
        const approvedDoctors = res.data?.success ? (res.data.data || []) : [];
        setDoctors(approvedDoctors);
        setSelectedDoctor(approvedDoctors[0] || null);
      } catch (err) {
        console.warn('Could not fetch doctors list:', err);
        setDoctors([]);
        setSelectedDoctor(null);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchApprovedDoctors();
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await getMyAppointments();
      if (res.data?.success) setAppointments(res.data.data || []);
    } catch (err) {
      console.warn('Could not load patient appointments:', err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const specialties = ['All', 'Cardiology', 'Pediatrics', 'General Medicine', 'Dermatology'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      doc.specialization?.toLowerCase() === selectedSpecialty.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="habs-dashboard-container">
      {/* ─── 1. Patient Quick Profile Summary Bar ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="min-w-0 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Patient</p>
            <p className="text-lg font-bold text-slate-900 truncate mt-0.5">{user?.name || 'Patient'}</p>
          </div>
        </div>

        <div className="min-w-0 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email</p>
            <p className="text-lg font-bold text-slate-900 truncate mt-0.5">{user?.email || 'N/A'}</p>
          </div>
        </div>

        <div className="min-w-0 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">Active Account</p>
          </div>
        </div>
      </div>

      {/* ─── 2. Specialist Selection & Slot Booking Grid ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        
        {/* Left Column: Doctor Selection (5 cols) */}
        <div className="min-w-0 lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select a Doctor</h2>
              <p className="text-xs text-slate-500 mt-1">Choose a physician to view their live schedule</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {filteredDoctors.length} available
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Specialty Filters */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`habs-filter-chip ${selectedSpecialty === spec ? 'active' : ''}`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Doctors List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loadingDoctors ? (
              <div className="py-14 text-center text-slate-400 text-sm">
                Loading doctors...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm">
                No specialists match your search.
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const docId = doc._id || doc.id;
                const selectedId = selectedDoctor?._id || selectedDoctor?.id;
                const isSelected = Boolean(docId && selectedId && String(docId) === String(selectedId));

                return (
                  <div
                    key={docId}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600/30'
                        : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                          {doc.specialization || 'General Practitioner'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          License: {doc.licenseNumber || 'Verified'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-3 py-2 rounded-lg shrink-0 transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      {isSelected ? 'Selected' : 'View Slots'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Slot Calendar (7 cols) */}
        <div className="min-w-0 lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
          {selectedDoctor ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Appointments for {selectedDoctor.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDoctor.specialization || 'General Practitioner'} · 30-minute consultation slots
                  </p>
                </div>
              </div>

              <SlotCalendar
                doctorId={selectedDoctor.id || selectedDoctor._id}
                preselectedDate={new Date().toISOString().split('T')[0]}
                onAppointmentBooked={loadAppointments}
              />
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Select a doctor on the left to see their open appointment slots.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="w-full bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Confirmed Appointments</h2>
            <p className="text-xs text-slate-500 mt-1">Every appointment you reserve is listed here.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
            <CalendarCheck2 className="w-4 h-4" /> {appointments.length} confirmed
          </span>
        </div>

        {loadingAppointments ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading your appointments…</p>
        ) : appointments.length === 0 ? (
          <div className="py-9 text-center text-slate-500">
            <CalendarCheck2 className="w-9 h-9 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No appointments confirmed yet</p>
            <p className="text-xs mt-1">Choose a doctor and reserve one of their open times above.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{appointment.doctor?.name || 'Doctor'}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">{appointment.doctor?.specialization || 'Consultation'}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Confirmed</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                  <Clock3 className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">{appointment.date} · {appointment.time}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default PatientDashboard;
