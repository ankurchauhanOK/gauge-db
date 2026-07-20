import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavRail from './NavRail';
import ContextPanel from './ContextPanel';
import { sections, getSectionForPath } from '../../data/navigation';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => getSectionForPath(location.pathname));
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    setActiveSection(getSectionForPath(location.pathname));
  }, [location.pathname]);

  function handleSectionChange(id: string) {
    setActiveSection(id);
    if (panelCollapsed) setPanelCollapsed(false);
  }

  return (
    <div className="min-h-screen bg-[#F6F6F4] flex">
      <NavRail
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <ContextPanel
        sections={sections}
        activeSection={activeSection}
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed((p) => !p)}
      />
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
