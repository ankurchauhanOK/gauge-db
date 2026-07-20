import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../data/service';
import { motion } from 'framer-motion';

const statusColor: Record<string, string> = {
  running: 'bg-status-pass',
  idle: 'bg-status-warning',
  offline: 'bg-status-offline',
  maintenance: 'bg-status-fail',
};

const statusLabel: Record<string, string> = {
  accepted: 'Accepted',
  rejected: 'Rejected',
  in_progress: 'In Progress',
};

export default function OperatorDashboard() {
  const navigate = useNavigate();
  type DashboardData = {
    todayProduction: number; accepted: number; rejected: number;
    target: number; qualityPercentage: number; shift: string;
    pending: number;
    machineStatus: { id: number; name: string; status: string }[];
    recentProduction: { serial: string; part: string; status: string; time: string; operator: string }[];
    alerts: { type: string; message: string; time: string }[];
  };
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = Math.min(100, ((data?.todayProduction ?? 0) / (data?.target ?? 1)) * 100);
  const activeMachines = data?.machineStatus.filter(m => m.status === 'running').length ?? 0;
  const totalMachines = data?.machineStatus.length ?? 0;

  return (
    <div className="max-w-[1440px] mx-auto px-10">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-heading font-semibold text-title text-text-primary">
          Production Dashboard
        </h1>
        <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm border border-border-light rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-status-pass" />
          <span className="font-body text-small font-medium text-text-secondary">{data?.shift}</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-heading font-bold text-hero text-text-primary leading-none">
            {data?.todayProduction ?? 0}
          </span>
          <span className="font-heading font-semibold text-section text-text-secondary/40">
            / {data?.target ?? 1}
          </span>
        </div>
        <p className="font-body text-body text-text-secondary mb-4">Today's Production</p>
        <div className="w-full max-w-md h-1.5 bg-neutral-200/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-text-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>

      <div className="h-px bg-border-light mb-10" />

      <div className="grid grid-cols-5 gap-8 mb-10">
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1.5">Accepted</p>
          <p className="font-heading font-bold text-display text-status-pass">{data?.accepted ?? 0}</p>
        </div>
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1.5">Rejected</p>
          <p className="font-heading font-bold text-display text-status-fail">{data?.rejected ?? 0}</p>
        </div>
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1.5">Pending</p>
          <p className="font-heading font-bold text-display text-status-warning">{data?.pending ?? 0}</p>
        </div>
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1.5">Quality</p>
          <p className="font-heading font-bold text-display text-text-primary">{data?.qualityPercentage ?? 0}%</p>
        </div>
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1.5">Machines</p>
          <p className="font-heading font-bold text-display text-text-primary">{activeMachines}/{totalMachines}</p>
        </div>
      </div>

      <div className="h-px bg-border-light mb-10" />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5">
          <p className="font-heading font-semibold text-section text-text-primary mb-5">Machines</p>
          <div className="space-y-3 mb-8">
            {data?.machineStatus.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor[m.status] || 'bg-neutral-300'}`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-body text-body font-medium text-text-primary">{m.name}</span>
                  <span className="font-body text-small font-medium text-text-secondary capitalize">{m.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/operator/inspect')}
            className="w-full bg-text-primary hover:bg-neutral-800 text-white font-heading font-semibold text-body h-12 rounded-2xl transition-all duration-apple ease-apple active:scale-[0.98]"
          >
            Inspect Component
          </button>
        </div>

        <div className="col-span-7">
          <div className="flex items-center justify-between mb-5">
            <p className="font-heading font-semibold text-section text-text-primary">Recent Production</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border-light overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3.5">Serial</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3.5">Part</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3.5">Status</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3.5">Time</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3.5">Operator</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentProduction.map((r, i) => (
                  <tr key={i} className="border-b border-border-light last:border-0">
                    <td className="font-body text-small font-mono font-medium text-text-primary px-5 py-3.5">{r.serial}</td>
                    <td className="font-body text-small text-text-primary px-5 py-3.5">{r.part}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 font-body text-tiny font-semibold ${
                        r.status === 'accepted' ? 'text-status-pass' :
                        r.status === 'rejected' ? 'text-status-fail' :
                        'text-status-warning'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'accepted' ? 'bg-status-pass' :
                          r.status === 'rejected' ? 'bg-status-fail' :
                          'bg-status-warning'
                        }`} />
                        {statusLabel[r.status] || r.status}
                      </span>
                    </td>
                    <td className="font-body text-small text-text-secondary px-5 py-3.5">{r.time}</td>
                    <td className="font-body text-small text-text-primary px-5 py-3.5">{r.operator}</td>
                  </tr>
                ))}
                {(!data?.recentProduction || data.recentProduction.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center font-body text-small text-text-secondary/60 px-5 py-8">
                      No production records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
