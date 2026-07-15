import { useState, useEffect } from 'react';
import { getMachines, createMachine, updateMachine } from '../data/service';
import type { Machine, MachineType } from '../../../shared/types';

export default function MachineList() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [form, setForm] = useState({ machine_code: '', name: '', ip_address: '', machine_type: 'inspection' });

  async function load() {
    setLoading(true);
    setMachines(await getMachines());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ machine_code: '', name: '', ip_address: '', machine_type: 'inspection' });
    setShowForm(true);
  }

  function openEdit(m: Machine) {
    setEditing(m);
    setForm({ machine_code: m.machine_code, name: m.name, ip_address: m.ip_address, machine_type: m.machine_type });
    setShowForm(true);
  }

  async function handleSave() {
    if (editing) {
      await updateMachine(editing.id, { ...form, machine_type: form.machine_type as MachineType });
    } else {
      await createMachine({ ...form, machine_type: form.machine_type as MachineType });
    }
    setShowForm(false);
    await load();
  }

  const statusColor: Record<string, string> = {
    idle: 'bg-gauge-amber',
    running: 'bg-gauge-green',
    offline: 'bg-surface-600',
    maintenance: 'bg-gauge-red',
  };

  const typeBadge: Record<string, string> = {
    inspection: 'bg-gauge-blue/10 text-gauge-blue',
    qr_marking: 'bg-gauge-green/10 text-gauge-green',
    production: 'bg-gauge-amber/10 text-gauge-amber',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Machines</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Machine</button>
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
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>IP Address</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {machines.map(m => (
                <tr key={m.id} className="hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono text-sm text-gauge-blue">{m.machine_code}</td>
                  <td className="py-3 px-4 text-sm text-surface-200">{m.name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge[m.machine_type] || ''}`}>
                      {m.machine_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-surface-400 font-mono">{m.ip_address}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColor[m.status] || 'bg-surface-600'}`} />
                      <span className="text-sm text-surface-300 capitalize">{m.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openEdit(m)} className="text-xs text-surface-400 hover:text-white transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Machine' : 'Add Machine'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Machine Code</label>
                <input className="input" value={form.machine_code} onChange={e => setForm(f => ({ ...f, machine_code: e.target.value }))} placeholder="e.g. INS-03" />
              </div>
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Machine name" />
              </div>
              <div>
                <label className="label">IP Address</label>
                <input className="input" value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} placeholder="192.168.1.100" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.machine_type} onChange={e => setForm(f => ({ ...f, machine_type: e.target.value }))}>
                  <option value="inspection">Inspection Station</option>
                  <option value="qr_marking">QR Marking Station</option>
                  <option value="production">Production Machine</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: string }) {
  return <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">{children}</th>;
}
