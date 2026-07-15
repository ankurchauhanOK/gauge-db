import { useState, useEffect } from 'react';
import { getAdminDashboard } from '../data/service';

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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'accepted': return 'text-gauge-green';
      case 'rejected': return 'text-gauge-red';
      case 'qr_marked': return 'text-gauge-blue';
      default: return 'text-gauge-amber';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Today's Production" value={data.todayProduction} color="text-white" />
        <StatCard label="Accepted" value={data.accepted} color="text-gauge-green" />
        <StatCard label="Rejected" value={data.rejected} color="text-gauge-red" />
        <StatCard label="Quality %" value={`${data.qualityPercentage}%`} color="text-gauge-amber" />
        <StatCard label="Active Machines" value={`${data.activeMachines}/${data.totalMachines}`} color="text-gauge-blue" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Recent Production</h3>
          <div className="space-y-2">
            {data.recentProduction.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-surface-200">{r.serial}</p>
                  <p className="text-xs text-surface-500">{r.part} · {r.operator}</p>
                  {r.reason && <p className="text-xs text-gauge-red mt-0.5">{r.reason}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${statusColor(r.status)}`}>{r.status}</p>
                  <p className="text-xs text-surface-500">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Alerts</h3>
          <div className="space-y-2">
            {data.alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-surface-800 last:border-0">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  a.type === 'error' ? 'bg-gauge-red' : a.type === 'warning' ? 'bg-gauge-amber' : 'bg-gauge-blue'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-300">{a.message}</p>
                  <p className="text-xs text-surface-500">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${color}`}>{value}</p>
    </div>
  );
}
