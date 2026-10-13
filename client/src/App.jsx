import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorAvailability from './pages/DoctorAvailability';
import Unauthorized from './pages/Unauthorized';
import VerifyEmail from './pages/VerifyEmail';

/**
 * Home redirect — sends authenticated users to their role-appropriate page.
 */
const HomeRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case 'doctor':
      return <Navigate to="/doctor/availability" replace />;
    case 'admin':
      return <Navigate to="/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--habs-bg)]">
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected: All authenticated users */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected: Doctor only */}
            <Route
              path="/doctor/availability"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorAvailability />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#1e293b',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1e293b',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
