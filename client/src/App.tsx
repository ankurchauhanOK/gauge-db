import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AppLayout from './components/layout/AppLayout';
import OperatorDashboard from './pages/OperatorDashboard';
import StartProcess from './pages/StartProcess';
import InspectionScreen from './pages/InspectionScreen';
import InspectionComplete from './pages/InspectionComplete';
import OperatorSearch from './pages/OperatorSearch';
import AdminDashboard from './pages/AdminDashboard';
import ComponentList from './pages/ComponentList';
import PlanBuilder from './pages/PlanBuilder';
import MachineList from './pages/MachineList';
import GaugeList from './pages/GaugeList';
import UserList from './pages/UserList';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <p className="text-surface-400">Loading...</p>
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
                      <Route path="dashboard" element={<OperatorDashboard />} />
                      <Route path="start" element={<StartProcess />} />
                      <Route path="inspection/:serial" element={<InspectionScreen />} />
                      <Route path="complete/:serial" element={<InspectionComplete />} />
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
                      <Route path="components" element={<ComponentList />} />
                      <Route path="plans" element={<PlanBuilder />} />
                      <Route path="machines" element={<MachineList />} />
                      <Route path="gauges" element={<GaugeList />} />
                      <Route path="users" element={<UserList />} />
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
                      <Route path="dashboard" element={<div className="p-6"><h1 className="text-xl font-bold">Supervisor Dashboard</h1><p className="text-surface-400 mt-2">Coming soon</p></div>} />
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
