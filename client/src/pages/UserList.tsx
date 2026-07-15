import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../data/service';
import type { User, UserRole } from '../../../shared/types';

const roles: UserRole[] = ['admin', 'operator', 'supervisor', 'quality'];

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

  const roleBadge: Record<string, string> = {
    admin: 'bg-gauge-red/10 text-gauge-red',
    operator: 'bg-gauge-blue/10 text-gauge-blue',
    supervisor: 'bg-gauge-amber/10 text-gauge-amber',
    quality: 'bg-gauge-green/10 text-gauge-green',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <button onClick={openCreate} className="btn-primary">+ Add User</button>
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
                <Th>Username</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono text-sm text-surface-200">{u.username}</td>
                  <td className="py-3 px-4 text-sm text-surface-300">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${u.is_active ? 'text-gauge-green' : 'text-surface-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-xs text-surface-400 hover:text-white transition-colors">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="text-xs text-gauge-red/70 hover:text-gauge-red transition-colors">Delete</button>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit User' : 'Add User'}</h2>
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
                <p className="text-xs text-surface-500">Default password: <span className="font-mono">default123</span></p>
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
