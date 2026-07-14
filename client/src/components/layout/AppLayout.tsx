import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/operator/dashboard', roles: ['operator'] },
  { label: 'Start Process', path: '/operator/start', roles: ['operator'] },
  { label: 'Search', path: '/operator/search', roles: ['operator'] },

  { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'quality'] },
  { label: 'Components', path: '/admin/components', roles: ['admin', 'quality'] },
  { label: 'Inspection Plans', path: '/admin/plans', roles: ['admin', 'quality'] },
  { label: 'Machines', path: '/admin/machines', roles: ['admin', 'quality'] },
  { label: 'Gauges', path: '/admin/gauges', roles: ['admin', 'quality'] },
  { label: 'Users', path: '/admin/users', roles: ['admin'] },
  { label: 'Production', path: '/admin/production', roles: ['admin', 'quality'] },
  { label: 'Reports', path: '/admin/reports', roles: ['admin', 'quality'] },
  { label: 'Audit Log', path: '/admin/audit', roles: ['admin'] },

  { label: 'Dashboard', path: '/supervisor/dashboard', roles: ['supervisor'] },
  { label: 'Rejected', path: '/supervisor/rejected', roles: ['supervisor'] },
  { label: 'Search', path: '/supervisor/search', roles: ['supervisor'] },
  { label: 'Reports', path: '/supervisor/reports', roles: ['supervisor'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'operator';
  const items = navItems.filter((item) => item.roles.includes(role));

  function getPanelLabel(): string {
    switch (role) {
      case 'operator':
        return 'Operator Panel';
      case 'admin':
      case 'quality':
        return 'Admin Panel';
      case 'supervisor':
        return 'Supervisor Panel';
      default:
        return '';
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <aside className="w-64 bg-surface-900 border-r border-surface-700 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gauge-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gauge DB</h2>
              <p className="text-xs text-surface-400">{getPanelLabel()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-700">
            <p className="text-xs text-surface-400">Signed in as</p>
            <p className="text-sm font-medium text-surface-200 truncate">{user?.name}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-gauge-blue/10 text-gauge-blue border border-gauge-blue/20'
                    : 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface-700">
          <button
            onClick={handleLogout}
            className="btn-ghost w-full text-sm"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
