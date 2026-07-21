import { useState, useEffect } from 'react';
import { getWorkstations, saveWorkstation, deleteWorkstation, assignUserToWorkstation, getMachines, getGauges, getUsers, getComponents } from '../data/service';
import type { Workstation, Machine, Gauge, User, Component } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminWorkstations() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Workstation | null>(null);
  const [form, setForm] = useState({ name: '', machine_id: 0, gauge_ids: [] as number[], component_type_id: 0 });
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [ws, mchs, ggs, usrs, comps] = await Promise.all([
      getWorkstations(), getMachines(), getGauges(), getUsers(), getComponents(),
    ]);
    setWorkstations(ws);
    setMachines(mchs);
    setGauges(ggs);
    setUsers(usrs);
    setComponents(comps);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', machine_id: machines[0]?.id || 0, gauge_ids: [], component_type_id: 0 });
    setShowForm(true);
    setMenuOpen(null);
  }

  function openEdit(ws: Workstation) {
    setEditing(ws);
    setForm({ name: ws.name, machine_id: ws.machine_id, gauge_ids: [...ws.gauge_ids], component_type_id: ws.component_type_id });
    setShowForm(true);
    setMenuOpen(null);
  }

  async function handleSave() {
    const data = {
      ...form,
      assigned_user_id: editing?.assigned_user_id ?? null,
      is_active: editing?.is_active ?? true,
    };
    await saveWorkstation(editing ? { ...data, id: editing.id } : data);
    setShowForm(false);
    await load();
  }

  async function handleDelete(ws: Workstation) {
    if (!window.confirm(`Delete workstation "${ws.name}"? This cannot be undone.`)) return;
    await deleteWorkstation(ws.id);
    setMenuOpen(null);
    await load();
  }

  async function handleAssignUser(wsId: number, userId: number | null) {
    await assignUserToWorkstation(wsId, userId);
    setMenuOpen(null);
    await load();
  }

  function toggleGauge(id: number) {
    setForm(f => ({
      ...f,
      gauge_ids: f.gauge_ids.includes(id) ? f.gauge_ids.filter(g => g !== id) : [...f.gauge_ids, id],
    }));
  }

  const assignedUserNames = new Map(users.map(u => [u.id, u.name]));
  const machineNames = new Map(machines.map(m => [m.id, `${m.name} (${m.machine_code})`]));
  const componentNames = new Map(components.map(c => [c.id, c.part_code]));

  return (
    <div>
      <PageHeader
        title="Workstations"
        subtitle="Manage production workstations and operator assignments"
        action={
          <button onClick={openCreate} className="btn-primary">+ Add Workstation</button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {workstations.map((ws, i) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface rounded-2xl border border-border-light overflow-hidden relative"
            >
              <div className="px-5 py-4 flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-body text-text-primary">{ws.name}</h3>
                  <p className="font-body text-tiny text-text-secondary mt-0.5">
                    {machineNames.get(ws.machine_id) || 'No machine'} · {componentNames.get(ws.component_type_id) || 'No component'}
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === ws.id ? null : ws.id)}
                    className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {menuOpen === ws.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-8 w-48 bg-surface rounded-xl border border-border-light shadow-elevated z-10 py-1"
                      >
                        <button onClick={() => openEdit(ws)} className="w-full text-left px-4 py-2 font-body text-small text-text-primary hover:bg-neutral-50 transition-colors">Edit</button>
                        <div className="border-t border-border-light my-1" />
                        <div className="px-4 py-2 font-body text-tiny font-medium text-text-secondary">Assign Operator</div>
                        {users.filter(u => u.role === 'operator' && u.is_active).map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleAssignUser(ws.id, u.id)}
                            className={`w-full text-left px-4 py-1.5 font-body text-small transition-colors ${
                              ws.assigned_user_id === u.id ? 'bg-primary/5 text-primary' : 'text-text-primary hover:bg-neutral-50'
                            }`}
                          >
                            {u.name} {ws.assigned_user_id === u.id ? '✓' : ''}
                          </button>
                        ))}
                        {ws.assigned_user_id && (
                          <button onClick={() => handleAssignUser(ws.id, null)} className="w-full text-left px-4 py-1.5 font-body text-small text-status-fail hover:bg-neutral-50 transition-colors">
                            Unassign
                          </button>
                        )}
                        <div className="border-t border-border-light my-1" />
                        <button onClick={() => handleDelete(ws)} className="w-full text-left px-4 py-2 font-body text-small text-status-fail hover:bg-neutral-50 transition-colors">Delete</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="border-t border-border-light mx-5" />

              <div className="px-5 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ws.is_active ? 'bg-status-pass' : 'bg-text-secondary/40'}`} />
                  <span className="font-body text-tiny text-text-secondary">{ws.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div>
                  <p className="font-body text-tiny font-medium text-text-secondary">Connected Gauges</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {ws.gauge_ids.length === 0 ? (
                      <span className="font-body text-tiny text-text-secondary italic">None</span>
                    ) : (
                      ws.gauge_ids.map(gid => {
                        const g = gauges.find(g => g.id === gid);
                        return (
                          <span key={gid} className="font-body text-tiny bg-neutral-100 text-text-secondary px-2 py-0.5 rounded-full">
                            {g?.gauge_name || `Gauge #${gid}`}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-body text-tiny font-medium text-text-secondary">Operator</p>
                  <p className="font-body text-tiny text-text-primary">
                    {ws.assigned_user_id ? assignedUserNames.get(ws.assigned_user_id) || 'Unknown' : '—'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Workstation' : 'Add Workstation'}>
        <div className="space-y-4">
          <div>
            <label className="label">Workstation Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CNC Lathe Station" />
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine_id} onChange={e => setForm(f => ({ ...f, machine_id: Number(e.target.value) }))}>
              <option value={0}>Select machine</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.machine_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Component Type</label>
            <select className="input" value={form.component_type_id} onChange={e => setForm(f => ({ ...f, component_type_id: Number(e.target.value) }))}>
              <option value={0}>Select component</option>
              {components.filter(c => c.status === 'active').map(c => (
                <option key={c.id} value={c.id}>{c.part_code} — {c.description}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Connected Gauges</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {gauges.filter(g => g.is_active).map(g => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.gauge_ids.includes(g.id)} onChange={() => toggleGauge(g.id)} className="rounded border-border-light" />
                  <span className="font-body text-small text-text-primary">{g.gauge_name}</span>
                </label>
              ))}
              {gauges.filter(g => g.is_active).length === 0 && (
                <p className="font-body text-tiny text-text-secondary italic">No active gauges available</p>
              )}
            </div>
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
