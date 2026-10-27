import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Server,
  Database,
  Lock,
  Activity
} from 'lucide-react';
import { getAllUsers, approveDoctor } from '../../api/auth.api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    patients: 0,
    doctors: 0,
    admins: 0,
    pendingDoctors: 0,
    verifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'users' | 'status'

  const fetchUsersData = async () => {
    try {
      const res = await getAllUsers();
      if (res.data?.success && res.data.data) {
        setUsers(res.data.data.users || []);
        if (res.data.data.counts) {
          setCounts(res.data.data.counts);
        }
      }
    } catch (err) {
      console.warn('Could not load users list:', err);
      toast.error('Failed to load user records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsersData();
  };

  const handleToggleDoctorApproval = async (docId, currentStatus) => {
    try {
      const res = await approveDoctor(docId);
      if (res.data?.success) {
        toast.success(
          `Doctor ${currentStatus ? 'access revoked' : 'approved successfully'}`
        );
        fetchUsersData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update approval status';
      toast.error(msg);
    }
  };

  const doctorsList = users.filter((u) => u.role === 'doctor');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="habs-dashboard-container">
      {/* ─── 1. Top KPI Summary Cards ──────────────────────────────── */}
      <div className="habs-kpi-grid">
        {/* Total Users */}
        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{counts.total}</p>
            <p className="text-xs text-slate-500 font-medium">{counts.verifiedUsers} verified users</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Patients */}
        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{counts.patients}</p>
            <p className="text-xs text-slate-500 font-medium">Registered patients</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Doctors */}
        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctors</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{counts.doctors}</p>
            <p className="text-xs text-slate-500 font-medium">Medical staff</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="habs-kpi-card">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{counts.pendingDoctors}</p>
            <p className={`text-xs font-semibold ${counts.pendingDoctors > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {counts.pendingDoctors > 0 ? 'Requires credential review' : 'All caught up'}
            </p>
          </div>
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${
            counts.pendingDoctors > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── 2. Clean Segmented Navigation & Action Bar ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 py-2">
        <div className="flex items-center gap-2.5 p-2 bg-slate-200/60 rounded-2xl border border-slate-200/80 w-fit">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`habs-tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          >
            <span>Doctor Approvals</span>
            {counts.pendingDoctors > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {counts.pendingDoctors}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`habs-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            All Users ({counts.total})
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`habs-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          >
            System Status
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* ─── 3. Tab 1: Doctor Approvals Table ───────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="habs-table-container">
          <div className="habs-table-header-box">
            <div>
              <h2 className="text-base font-bold text-slate-900">Doctor Credential Approvals</h2>
              <p className="text-xs text-slate-500 mt-1">Review credentials and toggle platform access</p>
            </div>
            <span className="text-xs font-bold text-slate-500 px-3 py-1 rounded-full bg-slate-100">
              {doctorsList.length} registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="habs-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>License No.</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctorsList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-slate-400 text-xs">
                      No doctor accounts registered yet.
                    </td>
                  </tr>
                ) : (
                  doctorsList.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-100/60 shadow-xs">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base">{doc.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-medium text-slate-700 text-sm">
                        <span className="inline-block px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100/60">
                          {doc.specialization || 'General Medicine'}
                        </span>
                      </td>
                      <td className="font-mono text-sm text-slate-600 font-semibold">
                        {doc.licenseNumber || '—'}
                      </td>
                      <td className="text-slate-600 text-sm font-medium">
                        {doc.phone || '—'}
                      </td>
                      <td>
                        {doc.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleToggleDoctorApproval(doc._id, doc.isApproved)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            doc.isApproved
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                          }`}
                        >
                          {doc.isApproved ? 'Revoke Access' : 'Approve Doctor'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 4. Tab 2: User Directory ─────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="habs-table-container">
          <div className="habs-table-header-box flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">User Registry</h2>
              <p className="text-xs text-slate-500 mt-1">Filter and inspect all accounts across the system</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="habs-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Phone</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-14 text-center text-slate-400 text-xs">
                      No users match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <span className="text-xs text-slate-400 mt-0.5 block">{u.email}</span>
                      </td>
                      <td>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : u.role === 'doctor'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.isVerified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Unverified</span>
                        )}
                      </td>
                      <td className="text-slate-600 text-xs">{u.phone || '—'}</td>
                      <td className="text-xs text-slate-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. Tab 3: System Status ──────────────────────────────── */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="habs-table-container p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Service Status
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Database</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> MongoDB Atlas Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Cache & Blacklist Store</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Redis v7 Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Real-Time Messaging</span>
                <span className="font-bold text-indigo-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Socket.io Active
                </span>
              </div>
            </div>
          </div>

          <div className="habs-table-container p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Security Architecture
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Authentication</span>
                <span className="font-mono font-semibold text-slate-800">HS256 JWT (24h expiry)</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Password Encryption</span>
                <span className="font-mono font-semibold text-slate-800">bcrypt (12 rounds)</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-600">Brute Force Protection</span>
                <span className="font-mono font-semibold text-slate-800">5 failed attempts / 15m lock</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminDashboard;


