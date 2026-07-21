import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AppLayout from './components/layout/AppLayout';
import WorkstationDashboard from './pages/WorkstationDashboard';
import InspectComponent from './pages/InspectComponent';
import OperatorSearch from './pages/OperatorSearch';
import AdminDashboard from './pages/AdminDashboard';
import AdminWorkstations from './pages/AdminWorkstations';
import ComponentList from './pages/ComponentList';
import ComponentDetail from './pages/ComponentDetail';
import MachineList from './pages/MachineList';
import GaugeList from './pages/GaugeList';
import UserList from './pages/UserList';
import ProductionRecords from './pages/ProductionRecords';
import Traceability from './pages/Traceability';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import SupervisorDashboard from './pages/SupervisorDashboard';
import LiveMachines from './pages/LiveMachines';
import RejectedList from './pages/RejectedList';
import SupervisorSearch from './pages/SupervisorSearch';
import SupervisorReports from './pages/SupervisorReports';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) {
    const redirects: Record<string, string> = {
      operator: '/operator/dashboard',
      admin: '/admin/dashboard',
      quality: '/admin/dashboard',
      supervisor: '/supervisor/dashboard',
    };
    return <Navigate to={redirects[user.role] || '/login'} replace />;
  }
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const redirects: Record<string, string> = {
    operator: '/operator/dashboard',
    admin: '/admin/dashboard',
    quality: '/admin/dashboard',
    supervisor: '/supervisor/dashboard',
  };
  return <Navigate to={redirects[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardRedirect />} />

          <Route
            path="/operator/*"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['operator']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<WorkstationDashboard />} />
                      <Route path="inspect" element={<InspectComponent />} />
                      <Route path="search" element={<OperatorSearch />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['admin', 'quality']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="workstations" element={<AdminWorkstations />} />
                      <Route path="components" element={<ComponentList />} />
                      <Route path="components/:id" element={<ComponentDetail />} />
                      <Route path="machines" element={<MachineList />} />
                      <Route path="gauges" element={<GaugeList />} />
                      <Route path="users" element={<UserList />} />
                      <Route path="production" element={<ProductionRecords />} />
                      <Route path="traceability" element={<Traceability />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="audit" element={<AuditLog />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/*"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['supervisor']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<SupervisorDashboard />} />
                      <Route path="machines" element={<LiveMachines />} />
                      <Route path="rejected" element={<RejectedList />} />
                      <Route path="search" element={<SupervisorSearch />} />
                      <Route path="reports" element={<SupervisorReports />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
