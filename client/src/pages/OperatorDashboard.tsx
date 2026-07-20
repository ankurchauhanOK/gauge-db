import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../data/service';
import StatCard from '../components/shared/StatCard';
import { motion } from 'framer-motion';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  type DashboardData = {
    todayProduction: number; accepted: number; rejected: number;
    target: number; qualityPercentage: number; shift: string;
    pending: number;
    machineStatus: { id: number; name: string; status: string }[];
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

  const machineColors: Record<string, string> = {
    idle: 'bg-status-warning',
    running: 'bg-status-pass',
    offline: 'bg-status-offline',
    maintenance: 'bg-status-fail',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-heading font-semibold text-small text-text-secondary tracking-wide uppercase mb-1">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          <h1 className="font-heading font-semibold text-title text-text-primary">
            Operator Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border-light rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-status-pass" />
          <span className="font-body text-small font-medium text-text-secondary">{data?.shift}</span>
        </div>
      </div>

      <div className="mb-10">
        <div className="bg-surface rounded-3xl p-8 shadow-card">
          <p className="font-body text-small font-medium text-text-secondary tracking-wide mb-3">
            Today's Production
          </p>
          <div className="flex items-end gap-6">
            <p className="font-heading font-bold text-hero text-text-primary leading-none">
              {data?.todayProduction ?? 0}
            </p>
            <div className="mb-2">
              <p className="font-body text-body text-text-secondary">
                Target <span className="font-semibold text-text-primary">{data?.target}</span>
              </p>
              <div className="w-48 h-1.5 bg-neutral-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-text-primary rounded-full transition-all duration-1000 ease-apple"
                  style={{ width: `${Math.min(100, ((data?.todayProduction ?? 0) / (data?.target ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5 mb-10">
        <StatCard label="Accepted" value={data?.accepted ?? 0} color="text-status-pass" subtitle="Today" />
        <StatCard label="Rejected" value={data?.rejected ?? 0} color="text-status-fail" subtitle="Today" />
        <StatCard label="Pending" value={data?.pending ?? 0} color="text-status-warning" subtitle="Awaiting completion" />
        <StatCard label="Quality" value={`${data?.qualityPercentage ?? 0}%`} color="text-status-info" subtitle="Today" />
        <StatCard label="Target Progress" value={`${Math.round(((data?.todayProduction ?? 0) / (data?.target ?? 1)) * 100)}%`} color="text-status-info" subtitle={`${data?.todayProduction ?? 0} of ${data?.target ?? 1}`} />
      </div>

      <div className="grid grid-cols-4 gap-5 mb-10">
        {data?.machineStatus.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-surface rounded-3xl p-5 shadow-card flex items-center gap-4"
          >
            <span className={`w-3 h-3 rounded-full shrink-0 ${machineColors[m.status] || 'bg-status-offline'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-body font-medium text-text-primary truncate">{m.name}</p>
              <p className="font-body text-small text-text-secondary capitalize">{m.status}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-surface rounded-3xl p-10 shadow-card flex flex-col items-center justify-center"
      >
        <p className="font-body text-body text-text-secondary mb-8">Ready to start a new inspection</p>
        <button
          onClick={() => navigate('/operator/inspect')}
          className="bg-text-primary hover:bg-neutral-800 text-white font-heading font-semibold text-section px-16 py-6 rounded-3xl transition-all duration-200 ease-apple shadow-card hover:shadow-card-hover active:scale-[0.98]"
        >
          Inspect Component
        </button>
      </motion.div>
    </div>
  );
}
