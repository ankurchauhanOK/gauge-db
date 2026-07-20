import { useState, useEffect } from 'react';
import { getAdminDashboard } from '../data/service';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import { motion } from 'framer-motion';

const statusMap: Record<string, 'PASS' | 'FAIL' | 'WARNING' | 'INFO'> = {
  accepted: 'PASS',
  rejected: 'FAIL',
  qr_marked: 'INFO',
};

export default function AdminDashboard() {
  const [data, setData] = useState<{
    todayProduction: number; accepted: number; rejected: number;
    target: number; qualityPercentage: number; activeMachines: number;
    totalMachines: number; alerts: { id: number; type: string; message: string; time: string }[];
    recentProduction: { serial: string; part: string; status: string; time: string; operator: string; reason?: string }[];
  } | null>(null);

  useEffect(() => { getAdminDashboard().then(setData); }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <p className="font-heading font-semibold text-small text-text-secondary tracking-wide uppercase mb-1">
          Overview
        </p>
        <h1 className="font-heading font-semibold text-title text-text-primary">
          Production Dashboard
        </h1>
      </div>

      <div className="mb-10">
        <div className="bg-surface rounded-3xl p-8 shadow-card">
          <p className="font-body text-small font-medium text-text-secondary tracking-wide mb-2">
            Today's Production
          </p>
          <div className="flex items-end gap-6">
            <p className="font-heading font-bold text-hero text-text-primary leading-none">
              {data.todayProduction}
            </p>
            <div className="mb-2">
              <p className="font-body text-body text-text-secondary">
                Target <span className="font-semibold text-text-primary">{data.target}</span>
              </p>
              <div className="w-48 h-1.5 bg-neutral-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-text-primary rounded-full transition-all duration-1000 ease-apple"
                  style={{ width: `${Math.min(100, (data.todayProduction / data.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-10">
        <StatCard
          label="Accepted"
          value={data.accepted}
          color="text-status-pass"
          subtitle="Today"
        />
        <StatCard
          label="Rejected"
          value={data.rejected}
          color="text-status-fail"
          subtitle="Today"
        />
        <StatCard
          label="Quality Rate"
          value={`${data.qualityPercentage}%`}
          color="text-status-warning"
          subtitle="Today"
        />
        <StatCard
          label="Active Machines"
          value={`${data.activeMachines}/${data.totalMachines}`}
          color="text-status-info"
          subtitle="Online"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-surface rounded-3xl p-6 shadow-card"
        >
          <h3 className="font-heading font-semibold text-card-title text-text-primary mb-5">
            Recent Production
          </h3>
          <div className="space-y-1">
            {data.recentProduction.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-border-light last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-body font-medium text-text-primary">
                    {r.serial}
                  </p>
                  <p className="font-body text-small text-text-secondary">
                    {r.part} &middot; {r.operator}
                  </p>
                  {r.reason && (
                    <p className="font-body text-small text-status-fail mt-0.5">{r.reason}</p>
                  )}
                </div>
                <div className="text-right flex items-center gap-3">
                  <StatusBadge status={statusMap[r.status] || 'WARNING'} size="sm" />
                  <p className="font-body text-small text-text-secondary whitespace-nowrap">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-surface rounded-3xl p-6 shadow-card"
        >
          <h3 className="font-heading font-semibold text-card-title text-text-primary mb-5">
            Alerts
          </h3>
          <div className="space-y-1">
            {data.alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 py-3 border-b border-border-light last:border-0"
              >
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  a.type === 'error' ? 'bg-status-fail' : a.type === 'warning' ? 'bg-status-warning' : 'bg-status-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-body text-text-primary">{a.message}</p>
                  <p className="font-body text-small text-text-secondary mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
