import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';

const Dashboard = () => {
  const { user, role } = useAuth();

  const getHeaderTitle = () => {
    if (role === 'admin') {
      return 'Admin Portal';
    }
    if (role === 'doctor') {
      return `Dr. ${user?.name ? user.name.replace(/^Dr\.?\s*/i, '') : 'Doctor'}`;
    }
    return `Welcome, ${user?.name ? user.name.split(' ')[0] : 'Patient'}`;
  };

  const getHeaderSubtitle = () => {
    if (role === 'admin') {
      return 'Doctor credentialing, user management, and system health';
    }
    if (role === 'doctor') {
      return `${user?.specialization || 'General Practitioner'} · License ${user?.licenseNumber || 'Verified'}`;
    }
    return 'Find doctors and reserve available appointment slots';
  };

  return (
    <DashboardLayout
      title={getHeaderTitle()}
      subtitle={getHeaderSubtitle()}
    >
      {role === 'admin' ? (
        <AdminDashboard />
      ) : role === 'doctor' ? (
        <DoctorDashboard />
      ) : (
        <PatientDashboard />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
