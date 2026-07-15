import { useState, useEffect } from 'react';
import { getProductionRecords } from '../data/service';

export default function ProductionRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [machine, setMachine] = useState('all');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const data = await getProductionRecords({ status, machine, search });
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status, machine]);

  const machines = [...new Set(records.map(r => r.machine))];

  function statusColor(s: string) {
    switch (s) {
      case 'accepted': return 'text-gauge-green';
      case 'rejected': return 'text-gauge-red';
      default: return 'text-gauge-amber';
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Production Records</h1>

      <div className="flex gap-4 flex-wrap">
        <select className="input w-40" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="in_progress">In Progress</option>
        </select>
        <select className="input w-44" value={machine} onChange={e => setMachine(e.target.value)}>
          <option value="all">All Machines</option>
          {machines.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex-1 flex gap-2">
          <input className="input flex-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial or part..." onKeyDown={e => e.key === 'Enter' && load()} />
          <button onClick={load} className="btn-primary">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                <Th>Serial</Th>
                <Th>Part</Th>
                <Th>Machine</Th>
                <Th>Operator</Th>
                <Th>Started</Th>
                <Th>Status</Th>
                <Th>QR</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono text-sm text-gauge-blue">{r.serial}</td>
                  <td className="py-3 px-4 text-sm text-surface-200">{r.part}</td>
                  <td className="py-3 px-4 text-sm text-surface-400">{r.machine}</td>
                  <td className="py-3 px-4 text-sm text-surface-400">{r.operator}</td>
                  <td className="py-3 px-4 text-sm text-surface-400">{r.started}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${statusColor(r.status as string)}`}>{r.status}</span>
                    {(r as { reason?: string }).reason && <p className="text-xs text-gauge-red mt-0.5">{(r as { reason?: string }).reason}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.qr_status === 'marked' ? 'bg-gauge-green/10 text-gauge-green' :
                      r.qr_status === 'pending' ? 'bg-gauge-amber/10 text-gauge-amber' :
                      'bg-surface-700 text-surface-400'
                    }`}>{r.qr_status}</span>
                  </td>
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
