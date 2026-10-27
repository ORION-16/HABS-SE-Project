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

  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50">
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
              duration: 3500,
              style: {
                background: '#ffffff',
                color: '#171825',
                border: '1px solid #e7eaf4',
                borderRadius: '1.25rem',
                boxShadow: '0 15px 35px -5px rgba(20, 24, 45, 0.1)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
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
