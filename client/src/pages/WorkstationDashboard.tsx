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

  // Result from inspection
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

  return (
    <div className="h-full flex flex-col">
      {/* Top Status Bar */}
      <div className="bg-surface border-b border-border-light px-10 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-body text-small text-text-secondary">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, <span className="font-semibold text-text-primary">{user?.name?.split(' ')[0]}</span>
            </p>
            <h1 className="font-heading font-semibold text-section text-text-primary mt-0.5">{workstation.name}</h1>
            <p className="font-body text-small text-text-secondary">{machine?.name || ''}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-heading font-bold text-[2rem] text-status-pass leading-none">{completed}</p>
              <p className="font-body text-tiny text-text-secondary mt-1">Today</p>
            </div>
            <div className="w-px h-10 bg-border-light" />
            <div className="text-center">
              <p className="font-heading font-bold text-[2rem] text-text-primary leading-none">{activeItem ? '1' : '0'}</p>
              <p className="font-body text-tiny text-text-secondary mt-1">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        <div className="w-full max-w-md space-y-6">
          {/* Result Banner */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                className={`rounded-2xl px-6 py-5 text-center border ${
                  result === 'accepted'
                    ? 'bg-status-pass/10 border-status-pass/20'
                    : 'bg-status-fail/10 border-status-fail/20'
                }`}
              >
                <p className={`font-heading font-bold text-section ${result === 'accepted' ? 'text-status-pass' : 'text-status-fail'}`}>
                  {result === 'accepted' ? '✓ Component Accepted' : '✗ Component Rejected'}
                </p>
                {resultSerial && (
                  <p className="font-body text-small text-text-secondary mt-1 font-mono">{resultSerial}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate / Continue */}
          {activeItem ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-status-info/10 rounded-2xl px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-info/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-status-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <p className="font-body text-small text-text-secondary">You have an inspection in progress</p>
              </div>
              <button
                onClick={handleContinueInspection}
                className="w-full py-5 rounded-2xl font-heading font-bold text-body transition-all bg-status-info text-white hover:bg-status-info/90 shadow-lg shadow-status-info/20"
              >
                Continue Inspection →
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-8 rounded-3xl font-heading font-bold text-[1.5rem] transition-all bg-text-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-black/10"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <div className="space-y-2">
                    <span>+ Generate Component</span>
                    <p className="font-body text-small font-normal text-white/60">Press to start a new production item</p>
                  </div>
                )}
              </button>

              {generatedSerial && generating && (
                <p className="text-center font-body text-small text-text-secondary mt-4">
                  Created {generatedSerial}...
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
