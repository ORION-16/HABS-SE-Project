import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SlotCalendar from '../components/SlotCalendar';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [doctorId, setDoctorId] = useState('');
  const [searchId, setSearchId] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchId(doctorId.trim());
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-animated py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Card */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--habs-accent)] to-[var(--habs-primary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--habs-text)]">
                Welcome, {user?.name}! 👋
              </h1>
              <p className="text-sm text-[var(--habs-text-muted)] capitalize">
                {role} Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Patient Dashboard */}
        {role === 'patient' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5">
                <div className="text-3xl mb-2">🗓️</div>
                <h3 className="text-sm font-medium text-[var(--habs-text-muted)]">Upcoming Appointments</h3>
                <p className="text-2xl font-bold text-[var(--habs-text)] mt-1">—</p>
                <p className="text-xs text-[var(--habs-text-muted)] mt-1">Coming in Module 3</p>
              </div>
              <div className="glass-card p-5">
                <div className="text-3xl mb-2">💊</div>
                <h3 className="text-sm font-medium text-[var(--habs-text-muted)]">Prescriptions</h3>
                <p className="text-2xl font-bold text-[var(--habs-text)] mt-1">—</p>
                <p className="text-xs text-[var(--habs-text-muted)] mt-1">Coming in Module 4</p>
              </div>
              <div className="glass-card p-5">
                <div className="text-3xl mb-2">🔔</div>
                <h3 className="text-sm font-medium text-[var(--habs-text-muted)]">Notifications</h3>
                <p className="text-2xl font-bold text-[var(--habs-text)] mt-1">—</p>
                <p className="text-xs text-[var(--habs-text-muted)] mt-1">Coming in Module 5</p>
              </div>
            </div>

            {/* Doctor Search */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--habs-text)] mb-4 flex items-center gap-2">
                <span>🔍</span> Find a Doctor
              </h2>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="input-habs"
                    placeholder="Enter Doctor ID to view availability"
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={!doctorId.trim()}>
                  View Slots
                </button>
              </form>
            </div>

            {/* Slot Calendar */}
            {searchId && <SlotCalendar doctorId={searchId} />}
          </div>
        )}

        {/* Doctor Dashboard redirect notice */}
        {role === 'doctor' && (
          <div className="glass-card p-6 text-center animate-fade-in">
            <div className="text-5xl mb-4">🩺</div>
            <h2 className="text-xl font-bold text-[var(--habs-text)] mb-2">Doctor Dashboard</h2>
            <p className="text-[var(--habs-text-muted)]">
              Use the Availability page to manage your schedule.
            </p>
          </div>
        )}

        {/* Admin notice */}
        {role === 'admin' && (
          <div className="glass-card p-6 text-center animate-fade-in">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold text-[var(--habs-text)] mb-2">Admin Dashboard</h2>
            <p className="text-[var(--habs-text-muted)]">
              Admin features coming in Module 6.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
