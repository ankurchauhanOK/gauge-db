import { useState, useEffect } from 'react';
import { getGauges, createGauge, updateGauge } from '../data/service';
import type { Gauge } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';
import { motion } from 'framer-motion';

const typeLabel: Record<string, string> = { serial: 'Serial', tcp: 'TCP/IP', modbus: 'Modbus', web_serial: 'Web USB' };

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

  return (
    <div>
      <PageHeader
        title="Gauges"
        subtitle="Manage measurement devices"
        action={
          <button onClick={openCreate} className="btn-primary">+ Add Gauge</button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {gauges.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-surface rounded-3xl p-6 shadow-card relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-heading font-semibold text-card-title text-text-primary">{g.gauge_name}</p>
                  <p className="font-body text-small text-text-secondary mt-0.5">{typeLabel[g.interface_type] || g.interface_type}</p>
                </div>
                <span className={`font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${
                  g.is_active ? 'bg-status-pass/8 text-status-pass' : 'bg-neutral-100 text-text-secondary/60'
                }`}>
                  {g.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-body text-small text-text-secondary">Connection</span>
                  <span className="font-body text-tiny text-text-primary font-mono">
                    {Object.entries(g.connection_config).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-small text-text-secondary">Calibration</span>
                  <span className={`font-body text-tiny ${g.calibration_due && new Date(g.calibration_due) < new Date() ? 'text-status-fail' : 'text-text-primary'}`}>
                    {g.calibration_date ? `${g.calibration_date} → ${g.calibration_due}` : 'Not set'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openEdit(g)}
                className="absolute top-6 right-16 font-body text-tiny font-medium text-text-secondary hover:text-text-primary transition-all duration-150"
              >
                Edit
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Gauge' : 'Add Gauge'}>
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
      </Modal>
    </div>
  );
}
