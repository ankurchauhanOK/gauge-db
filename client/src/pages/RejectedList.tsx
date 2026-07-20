import { useState, useEffect } from 'react';
import { getRejectedComponents } from '../data/service';
import PageHeader from '../components/shared/PageHeader';

export default function RejectedList() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRejectedComponents().then(d => { setRecords(d as Record<string, unknown>[]); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title="Rejected Components"
        subtitle={`${records.length} total rejected`}
      />

      {records.length === 0 ? (
        <div className="bg-surface rounded-3xl p-10 shadow-card text-center">
          <p className="font-body text-section text-text-secondary">No rejected components</p>
          <p className="font-body text-body text-text-secondary mt-1">All components have passed inspection</p>
        </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Serial Number</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Part Code</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Machine</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Operator</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Reason</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {records.map(r => (
                <tr key={r.id as number} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body font-medium text-text-primary">{r.serial as string}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{r.part as string}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{r.machine as string}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{r.operator as string}</td>
                  <td className="px-6 py-4 font-body text-body text-status-fail">{(r as { reason?: string }).reason || '-'}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{r.completed as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
