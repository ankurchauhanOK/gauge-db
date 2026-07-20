import { useState, useEffect } from 'react';
import { getAuditLogs } from '../data/service';
import PageHeader from '../components/shared/PageHeader';

const actionColors: Record<string, string> = {
  login: 'text-status-info',
  logout: 'text-status-info',
  create: 'text-status-pass',
  update: 'text-status-warning',
  delete: 'text-status-fail',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<{ id: number; user: string; action: string; entity: string; details: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(d => { setLogs(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="System-wide activity tracking" />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Action</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Entity</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Details</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body text-text-primary">{l.user}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-body font-semibold ${actionColors[l.action.toLowerCase()] || 'text-text-primary'}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{l.entity}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary max-w-md truncate">{l.details}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary whitespace-nowrap">{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
