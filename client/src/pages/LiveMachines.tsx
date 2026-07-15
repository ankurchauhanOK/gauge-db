import { useState, useEffect } from 'react';
import { getSupervisorDashboard } from '../data/service';

export default function LiveMachines() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSupervisorDashboard().then(d => { setData(d as Record<string, unknown>); setLoading(false); }); }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" /></div>;

  const machines = (data as { machineStatuses: { id: number; name: string; type: string; status: string; operator: string; currentSerial: string | null }[] }).machineStatuses;

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    running: { color: 'border-gauge-green bg-gauge-green/5', icon: '🟢', label: 'Running' },
    idle: { color: 'border-gauge-amber bg-gauge-amber/5', icon: '🟡', label: 'Idle' },
    offline: { color: 'border-gauge-red bg-gauge-red/5', icon: '🔴', label: 'Offline' },
    maintenance: { color: 'border-gauge-red bg-gauge-red/5', icon: '🔴', label: 'Maintenance' },
  };

  const typeLabel: Record<string, string> = {
    inspection: 'Inspection Station',
    qr_marking: 'QR Marking',
    production: 'Production Machine',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Live Machines</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gauge-green animate-pulse" />
          <span className="text-sm text-surface-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {machines.map(m => {
          const cfg = statusConfig[m.status] || statusConfig.offline;
          return (
            <div key={m.id} className={`card border-2 ${cfg.color} transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-white">{m.name}</p>
                  <p className="text-sm text-surface-400">{typeLabel[m.type] || m.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${m.status === 'running' ? 'bg-gauge-green animate-pulse' : m.status === 'idle' ? 'bg-gauge-amber' : 'bg-gauge-red'}`} />
                  <span className={`text-lg font-bold ${m.status === 'running' ? 'text-gauge-green' : m.status === 'idle' ? 'text-gauge-amber' : 'text-gauge-red'}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-surface-500">Operator</p>
                  <p className="text-surface-200">{m.operator || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Current Serial</p>
                  <p className="font-mono text-surface-200">{m.currentSerial || '-'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
