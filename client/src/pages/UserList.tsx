import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../data/service';
import type { User, UserRole } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';

const roles: UserRole[] = ['admin', 'operator', 'supervisor', 'quality'];

const roleBadge: Record<string, string> = {
  admin: 'bg-status-fail/8 text-status-fail',
  operator: 'bg-status-info/8 text-status-info',
  supervisor: 'bg-status-warning/8 text-status-warning',
  quality: 'bg-status-pass/8 text-status-pass',
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', name: '', role: 'operator' as UserRole });

  async function load() {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ username: '', name: '', role: 'operator' });
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ username: u.username, name: u.name, role: u.role });
    setShowForm(true);
  }

  async function handleSave() {
    if (editing) {
      await updateUser(editing.id, form);
    } else {
      await createUser(form);
    }
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system access"
        action={
          <button onClick={openCreate} className="btn-primary">+ Add User</button>
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
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Username</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body text-text-primary">{u.username}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{u.name}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-tiny font-semibold ${u.is_active ? 'text-status-pass' : 'text-text-secondary/50'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="font-body text-tiny font-medium text-text-secondary hover:text-text-primary transition-all duration-150">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="font-body text-tiny font-medium text-status-fail/70 hover:text-status-fail transition-all duration-150">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Add User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
          </div>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
              {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          {!editing && (
            <p className="font-body text-tiny text-text-secondary">Default password: <span className="font-mono">default123</span></p>
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
