import { useState, useEffect } from 'react';
import { getAuditLogs } from '../data/service';

export default function AuditLog() {
  const [logs, setLogs] = useState<{ id: number; user: string; action: string; entity: string; details: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAuditLogs().then(d => { setLogs(d); setLoading(false); }); }, []);

  const actionColor = (a: string) => {
    switch (a.toLowerCase()) {
      case 'login': case 'logout': return 'text-gauge-blue';
      case 'create': return 'text-gauge-green';
      case 'update': return 'text-gauge-amber';
      case 'delete': return 'text-gauge-red';
      default: return 'text-surface-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Details</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-surface-800/50">
                  <td className="py-3 px-4 text-sm font-mono text-surface-200">{l.user}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${actionColor(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-surface-400">{l.entity}</td>
                  <td className="py-3 px-4 text-sm text-surface-300 max-w-md truncate">{l.details}</td>
                  <td className="py-3 px-4 text-sm text-surface-500">{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: string }) {
  return <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">{children}</th>;
}
