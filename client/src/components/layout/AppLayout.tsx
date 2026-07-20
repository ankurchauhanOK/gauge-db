import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  roles: string[];
  icon: ReactNode;
}

const iconClasses = 'w-5 h-5';
const strokeProps = { strokeWidth: 1.5, fill: 'none' };

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/operator/dashboard',
    roles: ['operator'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="4" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Start Process',
    path: '/operator/start',
    roles: ['operator'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,8 12,16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Search',
    path: '/operator/search',
    roles: ['operator'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="4" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Components',
    path: '/admin/components',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Inspection Plans',
    path: '/admin/plans',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Machines',
    path: '/admin/machines',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="9" x2="12" y2="7" />
        <line x1="12" y1="15" x2="12" y2="17" />
        <line x1="9" y1="12" x2="7" y2="12" />
        <line x1="15" y1="12" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Gauges',
    path: '/admin/gauges',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Users',
    path: '/admin/users',
    roles: ['admin'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Production',
    path: '/admin/production',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    roles: ['admin', 'quality'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Audit Log',
    path: '/admin/audit',
    roles: ['admin'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    path: '/supervisor/dashboard',
    roles: ['supervisor'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="4" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Rejected',
    path: '/supervisor/rejected',
    roles: ['supervisor'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Search',
    path: '/supervisor/search',
    roles: ['supervisor'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/supervisor/reports',
    roles: ['supervisor'],
    icon: (
      <svg className={iconClasses} viewBox="0 0 24 24" {...strokeProps} stroke="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'operator';
  const items = navItems.filter((item) => item.roles.includes(role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ground flex">
      <aside className="w-64 bg-surface flex flex-col flex-shrink-0 border-r border-border-light">
        <div className="px-6 pt-8 pb-6">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-text-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-heading font-semibold text-sm text-text-primary leading-tight">
                Manufacturing
              </h1>
              <p className="font-heading font-semibold text-sm text-text-primary leading-tight">
                Control Center
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-body font-body font-medium transition-all duration-apple ease-apple ${
                  active
                    ? 'bg-neutral-100 text-text-primary'
                    : 'text-text-secondary hover:bg-neutral-50 hover:text-text-primary'
                }`}
              >
                <span className={`shrink-0 ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-light">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-small font-semibold text-text-secondary">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-text-primary truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-tiny text-text-secondary capitalize">{user?.role || 'operator'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-text-primary transition-all duration-apple ease-apple"
              title="Sign out"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="p-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
