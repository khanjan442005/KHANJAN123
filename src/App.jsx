import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import {
  AdminAddDoctorPage,
  AdminAppointmentsPage,
  AdminDashboardPage,
  AdminDoctorVerificationPage,
  AdminReportsPage,
  AdminUserManagementPage
} from './pages/AdminPages';
import {
  AdminRegisterPage,
  DoctorRegisterPage,
  ForgotPasswordPage,
  LoginPage,
  PatientRegisterPage,
  RegisterChooserPage,
  ResetPasswordPage
} from './pages/AuthPages';
import {
  DoctorAppointmentsPage,
  DoctorAvailabilityPage,
  DoctorDashboardPage,
  DoctorEarningsPage,
  DoctorProfilePage
} from './pages/DoctorPages';
import {
  PatientAppointmentHistoryPage,
  PatientBookAppointmentPage,
  PatientBookingConfirmPage,
  PatientDashboardPage,
  PatientDoctorProfilePage,
  PatientFindDoctorPage,
  PatientNotificationsPage,
  PatientPaymentPage,
  PatientProfilePage
} from './pages/PatientPages';
import { resolveLegacyRoute, routeForRole } from './utils/routes';

function ShellLoader() {
  return (
    <div className="public-shell">
      <div className="ambient-layer">
        <span className="ambient-orb orb-a" data-orbit="true"></span>
        <span className="ambient-orb orb-b" data-orbit="true"></span>
        <span className="ambient-orb orb-c" data-orbit="true"></span>
      </div>

      <main className="container-fluid-wide py-5 position-relative">
        <div className="glass-surface p-4 panel-card">Loading MediCore...</div>
      </main>
    </div>
  );
}

function RequireAuth({ roles, children }) {
  const { session } = useAuth();

  if (session.loading) {
    return <ShellLoader />;
  }

  if (!session.user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles?.length > 0 && !roles.includes(session.user.role)) {
    return <Navigate to={routeForRole(session.user.role)} replace />;
  }

  return children;
}

function LegacyRouteRedirect() {
  const location = useLocation();
  const nextPath = resolveLegacyRoute(location.pathname, location.search);

  return <Navigate to={nextPath || '/'} replace />;
}

function AppRoutes() {
  useEffect(() => {
    document.documentElement.classList.add('js-ready');

    return () => {
      document.documentElement.classList.remove('js-ready');
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />

      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterChooserPage />} />
      <Route path="/auth/register/patient" element={<PatientRegisterPage />} />
      <Route path="/auth/register/doctor" element={<DoctorRegisterPage />} />
      <Route path="/auth/register/admin" element={<AdminRegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      <Route path="/patient/dashboard" element={<RequireAuth roles={['Patient']}><PatientDashboardPage /></RequireAuth>} />
      <Route path="/patient/find-doctor" element={<RequireAuth roles={['Patient']}><PatientFindDoctorPage /></RequireAuth>} />
      <Route path="/patient/doctors/:id" element={<RequireAuth roles={['Patient']}><PatientDoctorProfilePage /></RequireAuth>} />
      <Route path="/patient/book/:id" element={<RequireAuth roles={['Patient']}><PatientBookAppointmentPage /></RequireAuth>} />
      <Route path="/patient/booking-confirm/:appointmentId" element={<RequireAuth roles={['Patient']}><PatientBookingConfirmPage /></RequireAuth>} />
      <Route path="/patient/payment/:appointmentId" element={<RequireAuth roles={['Patient']}><PatientPaymentPage /></RequireAuth>} />
      <Route path="/patient/appointments" element={<RequireAuth roles={['Patient']}><PatientAppointmentHistoryPage /></RequireAuth>} />
      <Route path="/patient/notifications" element={<RequireAuth roles={['Patient']}><PatientNotificationsPage /></RequireAuth>} />
      <Route path="/patient/profile" element={<RequireAuth roles={['Patient']}><PatientProfilePage /></RequireAuth>} />

      <Route path="/doctor/dashboard" element={<RequireAuth roles={['Doctor']}><DoctorDashboardPage /></RequireAuth>} />
      <Route path="/doctor/appointments" element={<RequireAuth roles={['Doctor']}><DoctorAppointmentsPage /></RequireAuth>} />
      <Route path="/doctor/availability" element={<RequireAuth roles={['Doctor']}><DoctorAvailabilityPage /></RequireAuth>} />
      <Route path="/doctor/earnings" element={<RequireAuth roles={['Doctor']}><DoctorEarningsPage /></RequireAuth>} />
      <Route path="/doctor/profile" element={<RequireAuth roles={['Doctor']}><DoctorProfilePage /></RequireAuth>} />

      <Route path="/admin/dashboard" element={<RequireAuth roles={['Admin']}><AdminDashboardPage /></RequireAuth>} />
      <Route path="/admin/doctor-verification" element={<RequireAuth roles={['Admin']}><AdminDoctorVerificationPage /></RequireAuth>} />
      <Route path="/admin/appointments" element={<RequireAuth roles={['Admin']}><AdminAppointmentsPage /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth roles={['Admin']}><AdminUserManagementPage /></RequireAuth>} />
      <Route path="/admin/add-doctor" element={<RequireAuth roles={['Admin']}><AdminAddDoctorPage /></RequireAuth>} />
      <Route path="/admin/reports" element={<RequireAuth roles={['Admin']}><AdminReportsPage /></RequireAuth>} />

      <Route path="*" element={<LegacyRouteRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="react-app">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
