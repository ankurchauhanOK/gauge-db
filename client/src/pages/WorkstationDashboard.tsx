import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyWorkstation, getQueueForWorkstation, generateComponent, getNextQueueItem, getTodayCompletedForWorkstation, getWaitingCountForWorkstation, getMachines, getGauges } from '../data/service';
import type { Workstation, Machine, Gauge, QueueItem } from '../../../shared/types';
import { motion } from 'framer-motion';

export default function WorkstationDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workstation, setWorkstation] = useState<Workstation | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nextItem, setNextItem] = useState<QueueItem | null>(null);
  const [completed, setCompleted] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const ws = await getMyWorkstation(user.id);
    setWorkstation(ws);
    if (ws) {
      const [mchs, ggs, q, next, comp, wait] = await Promise.all([
        getMachines(),
        getGauges(),
        getQueueForWorkstation(ws.id),
        getNextQueueItem(ws.id),
        getTodayCompletedForWorkstation(ws.id),
        getWaitingCountForWorkstation(ws.id),
      ]);
      setMachine(mchs.find(m => m.id === ws.machine_id) || null);
      setGauges(ggs);
      setQueue(q);
      setNextItem(next);
      setCompleted(comp);
      setWaiting(wait);
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
    if (!workstation) return;
    setGenerating(true);
    try {
      await generateComponent(workstation.component_type_id);
      await loadData();
    } finally {
      setGenerating(false);
    }
  }

  function handleStartInspection() {
    if (nextItem) {
      navigate(`/operator/inspect?itemId=${nextItem.id}`);
    }
  }

  function handleStartInspectionForItem(itemId: number) {
    navigate(`/operator/inspect?itemId=${itemId}`);
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
    <div className="max-w-[1440px] mx-auto px-10 space-y-6">
      <div className="bg-surface rounded-2xl border border-border-light p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-body text-small text-text-secondary mb-1">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Operator'}
            </p>
            <h1 className="font-heading font-semibold text-title text-text-primary">{workstation.name}</h1>
            <p className="font-body text-body text-text-secondary mt-1">{machine?.name || 'Unknown Machine'} · {machine?.machine_code || ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-heading font-bold text-title text-status-pass">{completed}</p>
              <p className="font-body text-tiny text-text-secondary">Today</p>
            </div>
            <div className="w-px h-10 bg-border-light" />
            <div className="text-right">
              <p className="font-heading font-bold text-title text-status-info">{waiting}</p>
              <p className="font-body text-tiny text-text-secondary">Waiting</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? 'Generating...' : '+ Generate Component'}
        </button>
        {nextItem && (
          <button onClick={handleStartInspection} className="btn-secondary bg-status-pass text-white hover:bg-status-pass/90 border-status-pass">
            Start Inspection →
          </button>
        )}
      </div>

      {queue.length > 0 ? (
        <div>
          <h2 className="font-heading font-semibold text-section text-text-primary mb-3">Queue</h2>
          <div className="space-y-2">
            {queue.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface rounded-xl border border-border-light px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="font-body text-tiny font-semibold text-text-secondary bg-neutral-200/60 px-2 py-0.5 rounded">
                    {item.component_part_code}
                  </span>
                  <div>
                    <p className="font-body text-body font-medium text-text-primary">{item.component_serial}</p>
                    <p className="font-body text-tiny text-text-secondary">{item.operation_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartInspectionForItem(item.id)}
                  className="font-body text-small font-medium text-primary hover:underline"
                >
                  Inspect
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border-light p-12 text-center">
          <p className="font-heading font-semibold text-section text-text-primary mb-2">All Caught Up</p>
          <p className="font-body text-body text-text-secondary">No components waiting for inspection at this workstation.</p>
        </div>
      )}
    </div>
  );
}
