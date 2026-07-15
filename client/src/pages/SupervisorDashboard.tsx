import { useState, useEffect } from 'react';
import { getSupervisorDashboard } from '../data/service';

export default function SupervisorDashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSupervisorDashboard().then(d => { setData(d as Record<string, unknown>); setLoading(false); }); }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" /></div>;

  const d = data as {
    todayProduction: number; target: number; accepted: number; rejected: number;
    qualityPercentage: number; efficiency: number;
    machineStatuses: { id: number; name: string; type: string; status: string; operator: string; currentSerial: string | null }[];
    machineWise: { machine: string; produced: number; accepted: number; rejected: number }[];
    operatorWise: { operator: string; produced: number; accepted: number; rejected: number }[];
    hourlyTrend: number[];
    rejectionReasons: { reason: string; count: number }[];
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'running': return 'bg-gauge-green';
      case 'idle': return 'bg-gauge-amber';
      case 'offline': return 'bg-gauge-red';
      default: return 'bg-surface-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Supervisor Dashboard</h1>

      <div className="grid grid-cols-6 gap-4">
        <StatCard label="Today's Production" value={d.todayProduction} color="text-white" />
        <StatCard label="Target" value={d.target} color="text-surface-400" />
        <StatCard label="Accepted" value={d.accepted} color="text-gauge-green" />
        <StatCard label="Rejected" value={d.rejected} color="text-gauge-red" />
        <StatCard label="Quality" value={`${d.qualityPercentage}%`} color="text-gauge-amber" />
        <StatCard label="Efficiency" value={`${d.efficiency}%`} color="text-gauge-blue" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Machine Status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Machine Status</h3>
          <div className="space-y-3">
            {d.machineStatuses.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg">
                <span className={`w-3 h-3 rounded-full ${statusColor(m.status)} ${m.status === 'running' ? 'animate-pulse' : ''}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200">{m.name}</p>
                  <p className="text-xs text-surface-500 capitalize">{m.status}{m.currentSerial ? ` · ${m.currentSerial}` : ''}</p>
                </div>
                <span className="text-xs text-surface-400">{m.operator}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection Analysis */}
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Rejection Analysis</h3>
          <div className="space-y-2">
            {d.rejectionReasons.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-sm text-surface-300 flex-1">{r.reason}</span>
                <div className="w-32 bg-surface-700 rounded-full h-2">
                  <div className="bg-gauge-red h-2 rounded-full" style={{ width: `${(r.count / Math.max(...d.rejectionReasons.map(x => x.count))) * 100}%` }} />
                </div>
                <span className="text-sm font-mono text-surface-400 w-6 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machine-wise & Operator-wise */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Machine-wise Production</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-700">
              <Th>Machine</Th><Th>Produced</Th><Th>Accepted</Th><Th>Rejected</Th>
            </tr></thead>
            <tbody className="divide-y divide-surface-800">
              {d.machineWise.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 text-surface-200">{r.machine}</td>
                  <td className="py-2 text-surface-300">{r.produced}</td>
                  <td className="py-2 text-gauge-green">{r.accepted}</td>
                  <td className="py-2 text-gauge-red">{r.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Operator-wise Production</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-700">
              <Th>Operator</Th><Th>Produced</Th><Th>Accepted</Th><Th>Rejected</Th>
            </tr></thead>
            <tbody className="divide-y divide-surface-800">
              {d.operatorWise.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 text-surface-200">{r.operator}</td>
                  <td className="py-2 text-surface-300">{r.produced}</td>
                  <td className="py-2 text-gauge-green">{r.accepted}</td>
                  <td className="py-2 text-gauge-red">{r.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hourly Trend (simplified bar chart) */}
      <div className="card">
        <h3 className="text-sm font-semibold text-surface-200 mb-3">Hourly Production Trend</h3>
        <div className="flex items-end gap-2 h-24">
          {d.hourlyTrend.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gauge-blue/20 rounded-t" style={{ height: `${(v / Math.max(...d.hourlyTrend)) * 100}%` }}>
                <div className="w-full bg-gauge-blue rounded-t transition-all" style={{ height: `${(v / Math.max(...d.hourlyTrend)) * 100}%` }} />
              </div>
              <span className="text-xs text-surface-500">{i + 6}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${color}`}>{value}</p>
    </div>
  );
}

function Th({ children }: { children: string }) {
  return <th className="text-left py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">{children}</th>;
}
