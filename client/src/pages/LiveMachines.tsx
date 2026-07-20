import { useState, useEffect } from 'react';
import { getSupervisorDashboard } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import { motion } from 'framer-motion';

const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
  running: { bg: 'border-status-pass/30 bg-status-pass/5', dot: 'bg-status-pass animate-pulse', label: 'Running' },
  idle: { bg: 'border-status-warning/30 bg-status-warning/5', dot: 'bg-status-warning', label: 'Idle' },
  offline: { bg: 'border-status-fail/30 bg-status-fail/5', dot: 'bg-status-fail', label: 'Offline' },
  maintenance: { bg: 'border-status-fail/30 bg-status-fail/5', dot: 'bg-status-fail', label: 'Maintenance' },
};

const typeLabel: Record<string, string> = {
  inspection: 'Inspection Station',
  qr_marking: 'QR Marking',
  production: 'Production Machine',
};

export default function LiveMachines() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupervisorDashboard().then(d => { setData(d as Record<string, unknown>); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" /></div>;

  const machines = (data as { machineStatuses: { id: number; name: string; type: string; status: string; operator: string; currentSerial: string | null }[] }).machineStatuses;

  return (
    <div>
      <PageHeader
        title="Live Machines"
        subtitle="Real-time machine status monitoring"
        action={
          <div className="flex items-center gap-2 bg-surface border border-border-light rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-status-pass animate-pulse" />
            <span className="font-body text-small font-medium text-text-secondary">Live</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-5">
        {machines.map((m, i) => {
          const cfg = statusConfig[m.status] || statusConfig.offline;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`bg-surface rounded-3xl p-6 shadow-card border-2 ${cfg.bg} transition-all`}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-heading font-semibold text-card-title text-text-primary">{m.name}</p>
                  <p className="font-body text-small text-text-secondary mt-0.5">{typeLabel[m.type] || m.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={`font-heading font-semibold text-body ${m.status === 'running' ? 'text-status-pass' : m.status === 'idle' ? 'text-status-warning' : 'text-status-fail'}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-tiny text-text-secondary">Operator</p>
                  <p className="font-body text-body font-medium text-text-primary mt-0.5">{m.operator || '-'}</p>
                </div>
                <div>
                  <p className="font-body text-tiny text-text-secondary">Current Serial</p>
                  <p className="font-mono text-body text-text-primary mt-0.5">{m.currentSerial || '-'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
