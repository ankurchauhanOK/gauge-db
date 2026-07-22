import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyWorkstation, generateComponent, getTodayCompletedForWorkstation, hasActiveQueueItem, getNextQueueItem, getMachines } from '../data/service';
import type { Workstation, Machine } from '../../../shared/types';
import { motion } from 'framer-motion';

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

  // If redirected back after inspection with a result
  const result = searchParams.get('result');
  const resultSerial = searchParams.get('serial');

  async function handleGenerate() {
    if (!workstation || generating) return;
    setGenerating(true);
    try {
      const item = await generateComponent(workstation.component_type_id);
      setGeneratedSerial(item.component_serial);
      // Navigate to inspect immediately after short delay
      setTimeout(() => navigate(`/operator/inspect?itemId=${item.id}`), 600);
    } finally {
      setGenerating(false);
    }
  }

  async function handleContinueInspection() {
    if (!workstation) return;
    const next = await getNextQueueItem(workstation.id);
    if (next) {
      navigate(`/operator/inspect?itemId=${next.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!workstation) {
    return (
      <div className="max-w-[1440px] mx-auto px-10">
        <div className="bg-surface rounded-3xl p-12 border border-border-light text-center mt-8">
          <p className="font-heading font-semibold text-section text-text-primary mb-2">No Workstation Assigned</p>
          <p className="font-body text-body text-text-secondary mb-6 max-w-md mx-auto">
            Your account is not assigned to any workstation. Please contact your supervisor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-10 pt-12">
      <div className="text-center mb-10">
        <p className="font-body text-small text-text-secondary mb-1">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Operator'}
        </p>
        <h1 className="font-heading font-semibold text-title text-text-primary">{workstation.name}</h1>
        <p className="font-body text-body text-text-secondary mt-1">{machine?.name || ''}</p>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl px-5 py-4 mb-6 text-center ${
            result === 'accepted' ? 'bg-status-pass/10 border border-status-pass/20' : 'bg-status-fail/10 border border-status-fail/20'
          }`}
        >
          <p className={`font-heading font-bold text-section ${result === 'accepted' ? 'text-status-pass' : 'text-status-fail'}`}>
            {result === 'accepted' ? '✓ Component OK' : '✗ Component Rejected'}
          </p>
          {resultSerial && (
            <p className="font-body text-tiny text-text-secondary mt-1 font-mono">{resultSerial}</p>
          )}
        </motion.div>
      )}

      <div className="bg-surface rounded-3xl border border-border-light p-10 text-center space-y-6">
        <div className="space-y-2">
          <p className="font-heading font-bold text-display text-status-pass">{completed}</p>
          <p className="font-body text-small text-text-secondary">Components completed today</p>
        </div>

        {generatedSerial && generating && (
          <p className="font-body text-body text-text-secondary">
            Created {generatedSerial} — opening inspection...
          </p>
        )}

        {activeItem ? (
          <div className="space-y-3">
            <div className="bg-status-info/10 rounded-xl px-4 py-3">
              <p className="font-body text-small text-text-secondary">You have a component in progress</p>
            </div>
            <button onClick={handleContinueInspection} className="btn-primary w-full py-4 text-body">
              Continue Inspection →
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-lg py-5 px-8 w-full"
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
        )}
      </div>
    </div>
  );
}
