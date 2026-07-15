import { useState, useEffect } from 'react';
import { getGauges, createGauge, updateGauge } from '../data/service';
import type { Gauge } from '../../../shared/types';

export default function GaugeList() {
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Gauge | null>(null);
  const [form, setForm] = useState({ gauge_name: '', interface_type: 'serial', port: '' });

  async function load() {
    setLoading(true);
    setGauges(await getGauges());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ gauge_name: '', interface_type: 'serial', port: '' });
    setShowForm(true);
  }

  function openEdit(g: Gauge) {
    setEditing(g);
    const conn = g.connection_config as Record<string, unknown>;
    setForm({ gauge_name: g.gauge_name, interface_type: g.interface_type, port: (conn.port as string) || (conn.host as string) || '' });
    setShowForm(true);
  }

  async function handleSave() {
    const conn: Record<string, unknown> = {};
    if (form.interface_type === 'serial') { conn.port = form.port; conn.baudRate = 9600; }
    else if (form.interface_type === 'tcp') { conn.host = form.port; conn.portNumber = 5000; }
    else { conn.baudRate = 115200; }

    if (editing) {
      await updateGauge(editing.id, { gauge_name: form.gauge_name, connection_config: conn } as Partial<Gauge>);
    } else {
      await createGauge({ gauge_name: form.gauge_name, interface_type: form.interface_type, connection_config: conn });
    }
    setShowForm(false);
    await load();
  }

  const typeLabel: Record<string, string> = { serial: 'Serial', tcp: 'TCP/IP', modbus: 'Modbus', web_serial: 'Web USB' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gauges</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Gauge</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {gauges.map(g => (
            <div key={g.id} className="card relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-semibold text-white">{g.gauge_name}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{typeLabel[g.interface_type] || g.interface_type}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  g.is_active ? 'bg-gauge-green/10 text-gauge-green' : 'bg-surface-700 text-surface-400'
                }`}>
                  {g.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Connection</span>
                  <span className="text-surface-300 font-mono text-xs">
                    {Object.entries(g.connection_config).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Calibration</span>
                  <span className={`text-xs ${g.calibration_due && new Date(g.calibration_due) < new Date() ? 'text-gauge-red' : 'text-surface-300'}`}>
                    {g.calibration_date ? `${g.calibration_date} → ${g.calibration_due}` : 'Not set'}
                  </span>
                </div>
              </div>
              <button onClick={() => openEdit(g)} className="absolute top-4 right-14 text-xs text-surface-400 hover:text-white transition-colors">Edit</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Gauge' : 'Add Gauge'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Gauge Name</label>
                <input className="input" value={form.gauge_name} onChange={e => setForm(f => ({ ...f, gauge_name: e.target.value }))} placeholder="e.g. Air Gauge 03" />
              </div>
              <div>
                <label className="label">Interface Type</label>
                <select className="input" value={form.interface_type} onChange={e => setForm(f => ({ ...f, interface_type: e.target.value }))}>
                  <option value="serial">Serial (RS-232)</option>
                  <option value="tcp">TCP/IP (Ethernet)</option>
                  <option value="web_serial">Web USB</option>
                  <option value="modbus">Modbus</option>
                </select>
              </div>
              <div>
                <label className="label">
                  {form.interface_type === 'serial' ? 'COM Port' : form.interface_type === 'tcp' ? 'Host/IP' : 'Details'}
                </label>
                <input className="input" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                  placeholder={form.interface_type === 'serial' ? 'COM3' : form.interface_type === 'tcp' ? '192.168.1.50' : 'Auto'} />
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
