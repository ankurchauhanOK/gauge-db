import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../data/service';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  type DashboardData = {
    todayProduction: number; accepted: number; rejected: number;
    target: number; qualityPercentage: number; shift: string;
    machineStatus: { id: number; name: string; status: string }[];
  };
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operator Dashboard</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-800 px-4 py-2 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-gauge-green animate-pulse" />
          <span className="text-sm text-surface-300">{data?.shift}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Today's Production"
          value={data?.todayProduction ?? 0}
          target={data?.target}
          color="text-white"
        />
        <StatCard
          label="Accepted"
          value={data?.accepted ?? 0}
          color="text-gauge-green"
        />
        <StatCard
          label="Rejected"
          value={data?.rejected ?? 0}
          color="text-gauge-red"
        />
        <StatCard
          label="Quality"
          value={`${data?.qualityPercentage ?? 0}%`}
          color="text-gauge-amber"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data?.machineStatus.map((m) => (
          <MachineCard key={m.id} name={m.name} status={m.status} />
        ))}
      </div>

      <div className="card flex flex-col items-center justify-center py-16 mt-4">
        <p className="text-surface-400 text-sm mb-6">Ready for next component</p>
        <button
          onClick={() => navigate('/operator/start')}
          className="bg-gauge-blue hover:bg-blue-600 text-white font-bold text-2xl px-20 py-6 rounded-xl transition-all duration-150 shadow-lg shadow-gauge-blue/20 hover:shadow-gauge-blue/40 active:scale-[0.98]"
        >
          Start Process
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, target, color }: { label: string; value: string | number; target?: number; color: string }) {
  return (
    <div className="card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${color}`}>{value}</p>
      {target !== undefined && (
        <p className="text-xs text-surface-500 mt-1">
          Target: {target}
        </p>
      )}
    </div>
  );
}

function MachineCard({ name, status }: { name: string; status: string }) {
  const statusColors: Record<string, string> = {
    idle: 'bg-gauge-amber',
    running: 'bg-gauge-green',
    offline: 'bg-surface-600',
    maintenance: 'bg-gauge-red',
  };
  return (
    <div className="card flex items-center gap-3">
      <span className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-surface-600'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-200 truncate">{name}</p>
        <p className="text-xs text-surface-500 capitalize">{status}</p>
      </div>
    </div>
  );
}
