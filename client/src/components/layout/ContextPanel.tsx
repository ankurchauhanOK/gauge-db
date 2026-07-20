import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Section, UserRole } from '../../data/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContextPanel({
  sections,
  activeSection,
  collapsed,
  onToggleCollapse,
}: {
  sections: Section[];
  activeSection: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const section = sections.find((s) => s.id === activeSection);
  if (!section) return null;

  const role = (user?.role || 'operator') as UserRole;
  const filteredItems = section.items.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`bg-surface flex flex-col border-r border-border-light shrink-0 transition-all duration-300 ease-apple overflow-hidden ${
        collapsed ? 'w-0 min-w-0' : 'w-[240px] min-w-[240px]'
      }`}
    >
      <div className="flex items-center justify-between px-5 pt-7 pb-4">
        <span className="font-body text-tiny font-semibold text-text-secondary/60 uppercase tracking-[0.08em]">
          {section.label}
        </span>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition-all duration-150"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
          ) : (
            <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-2 rounded-2xl text-[15px] font-body font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#F3F3F2] text-[#111]'
                  : 'text-[#737373] hover:bg-[#F8F8F7] hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
