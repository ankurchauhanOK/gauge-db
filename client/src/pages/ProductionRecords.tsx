import { useState, useEffect } from 'react';
import { getProductionRecords } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import SearchInput from '../components/shared/SearchInput';
import StatusBadge from '../components/shared/StatusBadge';

const statusMap: Record<string, 'PASS' | 'FAIL' | 'WARNING' | 'INFO'> = {
  accepted: 'PASS',
  rejected: 'FAIL',
  in_progress: 'WARNING',
};

const qrColors: Record<string, string> = {
  marked: 'bg-status-pass/8 text-status-pass',
  pending: 'bg-status-warning/8 text-status-warning',
  'n/a': 'bg-neutral-100 text-text-secondary/50',
};

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

  return (
    <div>
      <PageHeader title="Production Records" subtitle="Track all production runs" />

      <div className="flex gap-3 mb-6 items-center">
        <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="in_progress">In Progress</option>
        </select>
        <select className="input w-40" value={machine} onChange={e => setMachine(e.target.value)}>
          <option value="all">All Machines</option>
          {machines.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search serial or part..." />
          </div>
          <button onClick={load} className="btn-secondary">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Serial</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Part</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Machine</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Operator</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Started</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body font-medium text-text-primary">{r.serial}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{r.part}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{r.machine}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{r.operator}</td>
                  <td className="px-6 py-4 font-body text-small text-text-secondary">{r.started}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={statusMap[r.status] || 'WARNING'} size="sm" />
                    {r.reason && <p className="font-body text-tiny text-status-fail mt-1">{r.reason}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${qrColors[r.qr_status] || ''}`}>
                      {r.qr_status}
                    </span>
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
