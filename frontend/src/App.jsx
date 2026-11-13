
import { Navigate, Route, Routes } from 'react-router-dom';

import {
  ProtectedRoute,
  PublicOnlyRoute,
  RoleRoute,
} from './routes/ProtectedRoute';

import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Readings from './pages/Readings';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatient from './pages/DoctorPatient';
import AdminAssignments from './pages/AdminAssignments';

export default function App() {
  return (
    <Routes>
      {/* Public routes: accessible only when logged out */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* All authenticated routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* Patient routes */}
        <Route element={<RoleRoute roles={['PATIENT']} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/readings" element={<Readings />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Doctor routes */}
        <Route element={<RoleRoute roles={['DOCTOR']} />}>
          <Route element={<AppLayout />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route
              path="/doctor/patients/:patientId"
              element={<DoctorPatient />}
            />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminAssignments />} />
          </Route>
        </Route>
      </Route>

      {/* Default route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
