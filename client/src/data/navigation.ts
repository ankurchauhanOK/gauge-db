import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Factory,
  BarChart3,
  Users,
  Settings,
  Library,
  ClipboardList,
  Wrench,
  Gauge,
  Package,
  ScanLine,
  History,
} from 'lucide-react';

export type UserRole = 'operator' | 'admin' | 'quality' | 'supervisor';

export interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const sections: Section[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', path: '/operator/dashboard', roles: ['operator'] },
      { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'quality'] },
      { label: 'Dashboard', path: '/supervisor/dashboard', roles: ['supervisor'] },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    items: [
      { label: 'Component Library', path: '/admin/components', roles: ['admin', 'quality'] },
      { label: 'Workstations', path: '/admin/workstations', roles: ['admin', 'quality'] },
      { label: 'Machines', path: '/admin/machines', roles: ['admin', 'quality'] },
      { label: 'Gauges', path: '/admin/gauges', roles: ['admin', 'quality'] },
      { label: 'Production', path: '/admin/production', roles: ['admin', 'quality'] },
      { label: 'Traceability', path: '/admin/traceability', roles: ['admin', 'quality'] },
      { label: 'My Workstation', path: '/operator/dashboard', roles: ['operator'] },
      { label: 'Search', path: '/operator/search', roles: ['operator'] },
      { label: 'Live Machines', path: '/supervisor/machines', roles: ['supervisor'] },
      { label: 'Search', path: '/supervisor/search', roles: ['supervisor'] },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { label: 'Reports', path: '/admin/reports', roles: ['admin', 'quality'] },
      { label: 'Reports', path: '/supervisor/reports', roles: ['supervisor'] },
      { label: 'Rejected Parts', path: '/supervisor/rejected', roles: ['supervisor'] },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Users,
    items: [
      { label: 'Activity Log', path: '/admin/audit', roles: ['admin'] },
      { label: 'Users', path: '/admin/users', roles: ['admin'] },
      { label: 'Settings', path: '/admin/settings', roles: ['admin', 'quality'] },
    ],
  },
];

const pathToSection: Record<string, string> = {};
for (const section of sections) {
  for (const item of section.items) {
    pathToSection[item.path] = section.id;
  }
}

export function getSectionForPath(path: string): string {
  return pathToSection[path] || 'manufacturing';
}
