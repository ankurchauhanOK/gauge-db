import { useState, useEffect } from 'react';
import { getRejectedComponents } from '../data/service';

export default function RejectedList() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getRejectedComponents().then(d => { setRecords(d as Record<string, unknown>[]); setLoading(false); }); }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Rejected Components</h1>
        <span className="text-sm text-surface-400">{records.length} total</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700">
              <Th>Serial Number</Th>
              <Th>Part Code</Th>
              <Th>Machine</Th>
              <Th>Operator</Th>
              <Th>Reason</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {records.map(r => (
              <tr key={r.id as number} className="hover:bg-surface-800/50">
                <td className="py-3 px-4 font-mono text-sm text-gauge-blue">{r.serial as string}</td>
                <td className="py-3 px-4 text-sm text-surface-200">{r.part as string}</td>
                <td className="py-3 px-4 text-sm text-surface-400">{r.machine as string}</td>
                <td className="py-3 px-4 text-sm text-surface-400">{r.operator as string}</td>
                <td className="py-3 px-4 text-sm text-gauge-red">{(r as { reason?: string }).reason || '-'}</td>
                <td className="py-3 px-4 text-sm text-surface-500">{r.completed as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-surface-400 text-lg">No rejected components</p>
          <p className="text-surface-500 text-sm mt-1">All components have passed inspection</p>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: string }) {
  return <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">{children}</th>;
}
