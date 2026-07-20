import { useState, useEffect } from 'react';
import { getComponents, createComponent, updateComponent, deleteComponent } from '../data/service';
import type { Component } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';

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
    <div>
      <PageHeader
        title="Components"
        subtitle="Manage part master data"
        action={
          <button onClick={openCreate} className="btn-primary">+ Create Component</button>
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
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Part Code</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Description</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Customer</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Revision</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {components.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body font-medium text-text-primary">{c.part_code}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{c.description}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">{c.customer}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">v{c.revision}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${
                      c.status === 'active' ? 'bg-status-pass/8 text-status-pass' : 'bg-neutral-100 text-text-secondary/60'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="font-body text-tiny font-medium text-text-secondary hover:text-text-primary transition-all duration-150">Edit</button>
                      <button onClick={() => handleToggleStatus(c)} className="font-body text-tiny font-medium text-text-secondary hover:text-status-warning transition-all duration-150">
                        {c.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="font-body text-tiny font-medium text-status-fail/70 hover:text-status-fail transition-all duration-150">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Component' : 'Create Component'}>
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
      </Modal>
    </div>
  );
}
