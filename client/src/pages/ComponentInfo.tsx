import { useState, useEffect } from 'react';
import { getGauges, saveComponentMeasurements } from '../data/service';
import type { ComponentDetail, Measurement, Gauge } from '../../../shared/types';
import { motion } from 'framer-motion';

const statusColor: Record<string, string> = {
  active: 'bg-status-pass',
  inactive: 'bg-status-offline',
  obsolete: 'bg-status-fail',
};

export default function ComponentInfo({
  detail,
  onUpdate,
}: {
  detail: ComponentDetail;
  onUpdate: (d: ComponentDetail) => void;
}) {
  const c = detail.component;
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [editRows, setEditRows] = useState<Measurement[]>([]);

  useEffect(() => {
    getGauges().then(setGauges);
  }, []);

  function startEdit() {
    setEditRows(detail.measurements.map(m => ({ ...m })));
    setEditingMeasurements(true);
  }

  function cancelEdit() {
    setEditingMeasurements(false);
  }

  async function saveMeasurements() {
    const saved = await saveComponentMeasurements(c.id, editRows);
    onUpdate({ ...detail, measurements: saved });
    setEditingMeasurements(false);
  }

  function updateRow(index: number, field: keyof Measurement, value: string | number | null) {
    setEditRows(prev => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [field]: value };
      return rows;
    });
  }

  return (
    <div className="space-y-8">
      <div className="bg-surface rounded-3xl p-7 border border-border-light">
        <p className="font-heading font-semibold text-card-title text-text-primary mb-5">Details</p>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">Part Code</p>
            <p className="font-body text-body font-medium text-text-primary mt-0.5">{c.part_code}</p>
          </div>
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">Status</p>
            <span className={`inline-flex items-center gap-1.5 font-body text-tiny font-semibold mt-0.5 ${
              c.status === 'active' ? 'text-status-pass' : c.status === 'inactive' ? 'text-text-secondary/60' : 'text-status-fail'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor[c.status] || 'bg-neutral-300'}`} />
              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">Description</p>
            <p className="font-body text-body font-medium text-text-primary mt-0.5">{c.description}</p>
          </div>
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">Customer</p>
            <p className="font-body text-body font-medium text-text-primary mt-0.5">{c.customer}</p>
          </div>
          <div>
            <p className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">Revision</p>
            <p className="font-body text-body font-medium text-text-primary mt-0.5">{c.revision}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-heading font-semibold text-card-title text-text-primary">Measurements</p>
          {!editingMeasurements && (
            <button onClick={startEdit} className="font-body text-small font-medium text-text-secondary hover:text-text-primary transition-colors">
              Edit
            </button>
          )}
        </div>

        {detail.measurements.length === 0 && !editingMeasurements ? (
          <div className="bg-surface rounded-3xl p-10 border border-border-light text-center">
            <p className="font-body text-body text-text-secondary/60">No measurements configured</p>
            <button onClick={startEdit} className="btn-primary mt-4">Add Measurements</button>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-border-light overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Name</th>
                  <th className="text-right font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Nominal</th>
                  <th className="text-right font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Min Limit</th>
                  <th className="text-right font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Max Limit</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Unit</th>
                  <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Gauge</th>
                </tr>
              </thead>
              <tbody>
                {(editingMeasurements ? editRows : detail.measurements).map((m, i) => {
                  const gauge = gauges.find(g => g.id === m.gauge_id);
                  return (
                    <tr key={m.id} className="border-b border-border-light last:border-0">
                      <td className="px-5 py-3">
                        {editingMeasurements ? (
                          <input className="input h-9 text-small px-3" value={m.name} onChange={e => updateRow(i, 'name', e.target.value)} />
                        ) : (
                          <span className="font-body text-body font-medium text-text-primary">{m.name}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editingMeasurements ? (
                          <input className="input h-9 text-small px-3 w-24 text-right font-mono" type="number" step="0.001" value={m.nominal} onChange={e => updateRow(i, 'nominal', parseFloat(e.target.value) || 0)} />
                        ) : (
                          <span className="font-body text-small font-mono text-text-primary">{m.nominal.toFixed(3)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editingMeasurements ? (
                          <input className="input h-9 text-small px-3 w-24 text-right font-mono" type="number" step="0.001" value={m.min_limit} onChange={e => updateRow(i, 'min_limit', parseFloat(e.target.value) || 0)} />
                        ) : (
                          <span className="font-body text-small font-mono text-text-primary">{m.min_limit.toFixed(3)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {editingMeasurements ? (
                          <input className="input h-9 text-small px-3 w-24 text-right font-mono" type="number" step="0.001" value={m.max_limit} onChange={e => updateRow(i, 'max_limit', parseFloat(e.target.value) || 0)} />
                        ) : (
                          <span className="font-body text-small font-mono text-text-primary">{m.max_limit.toFixed(3)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editingMeasurements ? (
                          <input className="input h-9 text-small px-3 w-16" value={m.unit} onChange={e => updateRow(i, 'unit', e.target.value)} />
                        ) : (
                          <span className="font-body text-small text-text-secondary">{m.unit}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editingMeasurements ? (
                          <select className="input h-9 text-small px-3" value={m.gauge_id ?? ''} onChange={e => updateRow(i, 'gauge_id', e.target.value ? Number(e.target.value) : null)}>
                            <option value="">—</option>
                            {gauges.map(g => (
                              <option key={g.id} value={g.id}>{g.gauge_name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-body text-small text-text-secondary">{gauge?.gauge_name || '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editingMeasurements && (
          <div className="flex gap-3 mt-4">
            <button onClick={saveMeasurements} className="btn-primary">Save Changes</button>
            <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
