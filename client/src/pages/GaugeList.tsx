import { useState, useEffect } from 'react';
import { getGauges, createGauge, updateGauge, deleteGauge, getGaugeAssignments } from '../data/service';
import type { Gauge } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const typeLabel: Record<string, string> = { serial: 'Serial', tcp: 'TCP/IP', modbus: 'Modbus', web_serial: 'Web USB' };

function connSummary(g: Gauge): string {
  const c = g.connection_config as Record<string, unknown>;
  switch (g.interface_type) {
    case 'serial':
      return [c.port, c.baudRate ? `${c.baudRate} baud` : ''].filter(Boolean).join(' · ');
    case 'tcp':
      return [c.host, c.portNumber ? `port ${c.portNumber}` : ''].filter(Boolean).join(' · ');
    case 'web_serial':
      return 'Web USB';
    default:
      return typeLabel[g.interface_type] || g.interface_type;
  }
}

function connLabel(g: Gauge): string {
  switch (g.interface_type) {
    case 'serial': return 'RS-232';
    case 'tcp': return 'Ethernet';
    case 'web_serial': return 'Web USB';
    case 'modbus': return 'Modbus';
    default: return typeLabel[g.interface_type] || g.interface_type;
  }
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function useAssignedComponents(gaugeId: number): string[] {
  const [parts, setParts] = useState<string[]>([]);
  useEffect(() => {
    const assignments = getGaugeAssignments();
    const found = assignments.find(a => a.gaugeId === gaugeId);
    setParts(found?.componentPartCodes || []);
  }, [gaugeId]);
  return parts;
}

export default function GaugeList() {
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Gauge | null>(null);
  const [form, setForm] = useState({ gauge_name: '', interface_type: 'serial', port: '' });
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

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
    setMenuOpen(null);
  }

  function openEdit(g: Gauge) {
    setEditing(g);
    const conn = g.connection_config as Record<string, unknown>;
    setForm({
      gauge_name: g.gauge_name,
      interface_type: g.interface_type,
      port: (conn.port as string) || (conn.host as string) || '',
    });
    setShowForm(true);
    setMenuOpen(null);
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

  async function handleToggleActive(g: Gauge) {
    await updateGauge(g.id, { is_active: !g.is_active } as Partial<Gauge>);
    setMenuOpen(null);
    await load();
  }

  async function handleDelete(g: Gauge) {
    if (!window.confirm(`Delete gauge "${g.gauge_name}"? This cannot be undone.`)) return;
    await deleteGauge(g.id);
    setMenuOpen(null);
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
            <GaugeCard
              key={g.id}
              gauge={g}
              index={i}
              menuOpen={menuOpen}
              onMenuToggle={() => setMenuOpen(menuOpen === g.id ? null : g.id)}
              onEdit={() => openEdit(g)}
              onToggleActive={() => handleToggleActive(g)}
              onDelete={() => handleDelete(g)}
            />
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

function GaugeCard({
  gauge,
  index,
  menuOpen,
  onMenuToggle,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  gauge: Gauge;
  index: number;
  menuOpen: number | null;
  onMenuToggle: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const assigned = useAssignedComponents(gauge.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-surface rounded-3xl p-7 shadow-card relative"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-4">
          <p className="font-heading font-semibold text-card-title text-text-primary truncate">
            {gauge.gauge_name}
          </p>
          <p className="font-body text-small text-text-secondary mt-0.5">
            {connLabel(gauge)} · {connSummary(gauge)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1.5 font-body text-tiny font-semibold px-2.5 py-1 rounded-full ${
            gauge.is_active
              ? 'bg-status-pass/8 text-status-pass'
              : 'bg-neutral-100 text-text-secondary/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              gauge.is_active ? 'bg-status-pass' : 'bg-text-secondary/40'
            }`} />
            {gauge.is_active ? 'Active' : 'Inactive'}
          </span>
          <div className="relative">
            <button
              onClick={onMenuToggle}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition-all duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen === gauge.id && (
                <motion.div
                  ref={null}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-10 w-44 bg-surface rounded-2xl shadow-xl border border-border-light py-1.5 z-10"
                >
                  <button onClick={onEdit} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body font-body text-text-primary hover:bg-neutral-50 transition-all duration-100 text-left">
                    <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button onClick={onToggleActive} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body font-body text-text-primary hover:bg-neutral-50 transition-all duration-100 text-left">
                    <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      {gauge.is_active ? (
                        <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>
                      ) : (
                        <><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></>
                      )}
                    </svg>
                    {gauge.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="h-px bg-border-light my-1" />
                  <button onClick={onDelete} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body font-body text-status-fail hover:bg-status-fail/5 transition-all duration-100 text-left">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="h-px bg-border-light my-4" />

      <div className="space-y-4">
        <div>
          <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1">Connection</p>
          <div className="bg-neutral-50 rounded-xl px-4 py-3">
            {Object.entries(gauge.connection_config).map(([k, v]) => (
              <div key={k} className="flex justify-between text-small">
                <span className="font-body text-text-secondary">{k}</span>
                <span className="font-body font-medium text-text-primary font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1">Calibration</p>
            <div className="bg-neutral-50 rounded-xl px-4 py-3 space-y-1">
              <div className="flex justify-between text-small">
                <span className="font-body text-text-secondary">Last</span>
                <span className="font-body font-medium text-text-primary">{formatDate(gauge.calibration_date)}</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="font-body text-text-secondary">Due</span>
                <span className={`font-body font-medium font-mono ${
                  gauge.calibration_due && new Date(gauge.calibration_due) < new Date() ? 'text-status-fail' : 'text-text-primary'
                }`}>
                  {formatDate(gauge.calibration_due)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase mb-1">Used By</p>
            <div className="bg-neutral-50 rounded-xl px-4 py-3 min-h-[2.5rem]">
              {assigned.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {assigned.map((name, i) => (
                    <span key={i} className="font-body text-tiny px-2 py-0.5 rounded-full bg-surface text-text-secondary border border-border-light">
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-small text-text-secondary/60">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
