import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from './routes/ProtectedRoute';
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
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['PATIENT']} />}><Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} /><Route path="/readings" element={<Readings />} /><Route path="/reports" element={<Reports />} />
        </Route></Route>
        <Route element={<RoleRoute roles={['DOCTOR']} />}><Route element={<AppLayout />}>
          <Route path="/doctor" element={<DoctorDashboard />} /><Route path="/doctor/patients/:patientId" element={<DoctorPatient />} />
        </Route></Route>
        <Route element={<RoleRoute roles={['ADMIN']} />}><Route element={<AppLayout />}><Route path="/admin" element={<AdminAssignments />} /></Route></Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
