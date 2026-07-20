import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Section } from '../../data/navigation';

export default function NavRail({
  sections,
  activeSection,
  onSectionChange,
}: {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-[72px] min-w-[72px] bg-[#FCFCFB] flex flex-col items-center border-r border-border-light py-4 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="w-9 h-9 bg-text-primary rounded-xl flex items-center justify-center mb-8"
      >
        <span className="text-white font-heading font-bold text-sm">G</span>
      </button>

      <nav className="flex-1 flex flex-col items-center gap-1.5">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              title={section.label}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'bg-[#F3F3F2] text-text-primary'
                  : 'text-text-secondary hover:bg-neutral-50 hover:text-text-primary'
              }`}
            >
              <Icon className="w-[20px] h-[20px]" strokeWidth={1.8} />
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5 mt-auto">
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
          <span className="text-small font-semibold text-text-secondary">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition-all duration-150"
          title="Sign out"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
