import { useState, useEffect } from 'react';
import { getMachines, createMachine, updateMachine } from '../data/service';
import type { Machine, MachineType } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';

const statusColors: Record<string, string> = {
  idle: 'bg-status-warning',
  running: 'bg-status-pass',
  offline: 'bg-status-offline',
  maintenance: 'bg-status-fail',
};

const typeBadge: Record<string, string> = {
  inspection: 'bg-status-info/8 text-status-info',
  qr_marking: 'bg-status-pass/8 text-status-pass',
  production: 'bg-status-warning/8 text-status-warning',
};

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

  return (
    <div>
      <PageHeader
        title="Machines"
        subtitle="Manage inspection stations and production equipment"
        action={
          <button onClick={openCreate} className="btn-primary">+ Add Machine</button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Code</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Type</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">IP Address</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {machines.map(m => (
                <tr key={m.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body font-medium text-text-primary">{m.machine_code}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{m.name}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${typeBadge[m.machine_type] || ''}`}>
                      {m.machine_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-body text-text-secondary">{m.ip_address}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors[m.status] || 'bg-status-offline'}`} />
                      <span className="font-body text-body text-text-primary capitalize">{m.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(m)} className="font-body text-tiny font-medium text-text-secondary hover:text-text-primary transition-all duration-150">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Machine' : 'Add Machine'}>
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
      </Modal>
    </div>
  );
}
