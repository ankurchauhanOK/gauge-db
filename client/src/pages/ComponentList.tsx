import { useState, useEffect } from 'react';
import { getComponents, createComponent, updateComponent, deleteComponent } from '../data/service';
import type { Component } from '../../../shared/types';

export default function ComponentList() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Component | null>(null);
  const [form, setForm] = useState({ part_code: '', description: '', customer: '' });

  async function load() {
    setLoading(true);
    const data = await getComponents();
    setComponents(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ part_code: '', description: '', customer: '' });
    setShowForm(true);
  }

  function openEdit(c: Component) {
    setEditing(c);
    setForm({ part_code: c.part_code, description: c.description, customer: c.customer });
    setShowForm(true);
  }

  async function handleSave() {
    if (editing) {
      await updateComponent(editing.id, form);
    } else {
      await createComponent(form);
    }
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this component?')) return;
    await deleteComponent(id);
    await load();
  }

  async function handleToggleStatus(c: Component) {
    await updateComponent(c.id, { status: c.status === 'active' ? 'inactive' : 'active' });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Components</h1>
        <button onClick={openCreate} className="btn-primary">+ Create Component</button>
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
                <Th>Part Code</Th>
                <Th>Description</Th>
                <Th>Customer</Th>
                <Th>Revision</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {components.map((c) => (
                <tr key={c.id} className="hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono text-sm text-gauge-blue">{c.part_code}</td>
                  <td className="py-3 px-4 text-sm text-surface-200">{c.description}</td>
                  <td className="py-3 px-4 text-sm text-surface-400">{c.customer}</td>
                  <td className="py-3 px-4 text-sm text-surface-400">v{c.revision}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'active' ? 'bg-gauge-green/10 text-gauge-green' : 'bg-surface-700 text-surface-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs text-surface-400 hover:text-white transition-colors">Edit</button>
                      <button onClick={() => handleToggleStatus(c)} className="text-xs text-surface-400 hover:text-gauge-amber transition-colors">
                        {c.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-gauge-red/70 hover:text-gauge-red transition-colors">Delete</button>
                    </div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Component' : 'Create Component'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Part Code</label>
                <input className="input" value={form.part_code} onChange={e => setForm(f => ({ ...f, part_code: e.target.value }))} placeholder="e.g. BUSH-002" />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Component description" />
              </div>
              <div>
                <label className="label">Customer</label>
                <input className="input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Customer name" />
              </div>
              {editing && (
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as 'active' | 'inactive' | 'obsolete' })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>
              )}
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
