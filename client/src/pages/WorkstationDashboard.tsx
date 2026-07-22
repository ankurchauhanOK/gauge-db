import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyWorkstation, generateComponent, getTodayCompletedForWorkstation, hasActiveQueueItem, getNextQueueItem, getMachines } from '../data/service';
import type { Workstation, Machine } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkstationDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workstation, setWorkstation] = useState<Workstation | null>(null);
  const [completed, setCompleted] = useState(0);
  const [activeItem, setActiveItem] = useState(false);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedSerial, setGeneratedSerial] = useState<string | null>(null);

  const result = searchParams.get('result');
  const resultSerial = searchParams.get('serial');

  const loadData = useCallback(async () => {
    if (!user) return;
    const ws = await getMyWorkstation(user.id);
    setWorkstation(ws);
    if (ws) {
      const [mchs, comp, active] = await Promise.all([
        getMachines(),
        getTodayCompletedForWorkstation(ws.id),
        hasActiveQueueItem(ws.id),
      ]);
      setMachine(mchs.find(m => m.id === ws.machine_id) || null);
      setCompleted(comp);
      setActiveItem(active);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!workstation) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData, workstation]);

  async function handleGenerate() {
    if (!workstation || generating) return;
    setGenerating(true);
    try {
      const item = await generateComponent(workstation.component_type_id);
      setGeneratedSerial(item.component_serial);
      setTimeout(() => navigate(`/operator/inspect?itemId=${item.id}`), 600);
    } finally {
      setGenerating(false);
    }
  }

  async function handleContinueInspection() {
    if (!workstation) return;
    const next = await getNextQueueItem(workstation.id);
    if (next) navigate(`/operator/inspect?itemId=${next.id}`);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!workstation) {
    return (
      <div className="h-full flex items-center justify-center px-10">
        <div className="bg-surface rounded-3xl p-12 border border-border-light text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
            </svg>
          </div>
          <p className="font-heading font-semibold text-section text-text-primary mb-2">No Workstation Assigned</p>
          <p className="font-body text-body text-text-secondary">Please contact your supervisor to get assigned to a workstation.</p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="h-full flex items-center justify-center px-10">
      <div className="w-full max-w-sm space-y-8">
        {/* Compact Header */}
        <div className="text-center">
          <p className="font-body text-small text-text-secondary">{greeting}, {user?.name?.split(' ')[0]}</p>
          <h1 className="font-heading font-semibold text-section text-text-primary mt-0.5">{workstation.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="font-body text-tiny text-text-secondary">{machine?.name || ''}</span>
            <span className="w-px h-3 bg-border-light" />
            <span className="font-body text-tiny font-medium text-status-pass">{completed} today</span>
          </div>
        </div>

        {/* Result Banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl px-5 py-4 text-center border ${
                result === 'accepted'
                  ? 'bg-status-pass/10 border-status-pass/20'
                  : 'bg-status-fail/10 border-status-fail/20'
              }`}
            >
              <p className={`font-heading font-bold text-body ${result === 'accepted' ? 'text-status-pass' : 'text-status-fail'}`}>
                {result === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
              </p>
              {resultSerial && <p className="font-body text-tiny text-text-secondary mt-0.5 font-mono">{resultSerial}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        {activeItem ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleContinueInspection}
              className="w-full py-4 rounded-2xl font-heading font-semibold text-body bg-status-info text-white hover:bg-status-info/90 transition-all shadow-lg shadow-status-info/20"
            >
              Continue Inspection →
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-5 rounded-2xl font-heading font-semibold text-body bg-text-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                '+ Generate Component'
              )}
            </button>
          </motion.div>
        )}

        {generatedSerial && generating && (
          <p className="text-center font-body text-tiny text-text-secondary">{generatedSerial}</p>
        )}
      </div>
    </div>
  );
}
