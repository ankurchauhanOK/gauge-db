import { useState, useEffect } from 'react';
import { getMachines, saveComponentFlow } from '../data/service';
import type { ComponentDetail, ManufacturingStep, ManufacturingOperation, Machine } from '../../../shared/types';
import { motion } from 'framer-motion';

const machineColor: Record<string, string> = {
  inspection: 'border-l-status-info',
  production: 'border-l-status-pass',
  qr_marking: 'border-l-status-warning',
};

export default function ComponentFlow({
  detail,
  onUpdate,
}: {
  detail: ComponentDetail;
  onUpdate: (d: ComponentDetail) => void;
}) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [steps, setSteps] = useState<ManufacturingStep[]>(() =>
    detail.flow_steps.map(s => ({
      ...s,
      operations: s.operations.map(o => ({ ...o })),
    }))
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMachines().then(setMachines);
  }, []);

  function addStep() {
    const maxId = Math.max(0, ...steps.map(s => s.id));
    const newStep: ManufacturingStep = {
      id: maxId + 1,
      component_id: detail.component.id,
      machine_id: machines[0]?.id || 1,
      step_order: steps.length + 1,
      operations: [],
    };
    setSteps([...steps, newStep]);
    setDirty(true);
  }

  function removeStep(stepId: number) {
    const filtered = steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, step_order: i + 1 }));
    setSteps(filtered);
    setDirty(true);
  }

  function updateStepMachine(stepId: number, machineId: number) {
    setSteps(steps.map(s => s.id === stepId ? { ...s, machine_id: machineId } : s));
    setDirty(true);
  }

  function addOperation(stepId: number) {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      const maxId = Math.max(0, ...s.operations.map(o => o.id), ...steps.flatMap(st => st.operations.map(o => o.id)));
      const newOp: ManufacturingOperation = {
        id: maxId + 1,
        name: '',
        order: s.operations.length + 1,
        measurement_ids: [],
      };
      return { ...s, operations: [...s.operations, newOp] };
    }));
    setDirty(true);
  }

  function removeOperation(stepId: number, opId: number) {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      const filtered = s.operations.filter(o => o.id !== opId).map((o, i) => ({ ...o, order: i + 1 }));
      return { ...s, operations: filtered };
    }));
    setDirty(true);
  }

  function updateOpName(stepId: number, opId: number, name: string) {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, operations: s.operations.map(o => o.id === opId ? { ...o, name } : o) };
    }));
    setDirty(true);
  }

  function toggleOpMeasurement(stepId: number, opId: number, measurementId: number) {
    setSteps(steps.map(s => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        operations: s.operations.map(o => {
          if (o.id !== opId) return o;
          const has = o.measurement_ids.includes(measurementId);
          return {
            ...o,
            measurement_ids: has
              ? o.measurement_ids.filter(m => m !== measurementId)
              : [...o.measurement_ids, measurementId],
          };
        }),
      };
    }));
    setDirty(true);
  }

  function moveStep(stepId: number, direction: 'up' | 'down') {
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    const next = [...steps];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setSteps(next.map((s, i) => ({ ...s, step_order: i + 1 })));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const saved = await saveComponentFlow(detail.component.id, steps);
    onUpdate({ ...detail, flow_steps: saved });
    setDirty(false);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {steps.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 border border-border-light text-center">
          <p className="font-heading font-semibold text-section text-text-primary mb-2">No Manufacturing Flow</p>
          <p className="font-body text-body text-text-secondary mb-6 max-w-md mx-auto">
            This component has not been configured yet. Configure machines, operations, and inspection sequence.
          </p>
          <button onClick={addStep} className="btn-primary">Create Flow</button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {steps.map((step, si) => {
              const machine = machines.find(m => m.id === step.machine_id);
              const availableMeasurements = detail.measurements;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-surface rounded-2xl border border-border-light border-l-4 ${machineColor[machine?.machine_type || 'inspection']}`}
                >
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-border-light bg-neutral-50/50">
                    <span className="font-body text-tiny font-semibold text-text-secondary bg-neutral-200/60 px-2 py-0.5 rounded">
                      Step {step.step_order}
                    </span>
                    <select
                      className="font-body text-body font-medium text-text-primary bg-transparent border-none focus:outline-none cursor-pointer"
                      value={step.machine_id}
                      onChange={e => updateStepMachine(step.id, Number(e.target.value))}
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.machine_code})</option>
                      ))}
                    </select>
                    <div className="flex-1" />
                    <button onClick={() => moveStep(step.id, 'up')} disabled={si === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 p-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="18,15 12,9 6,15" /></svg>
                    </button>
                    <button onClick={() => moveStep(step.id, 'down')} disabled={si === steps.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30 p-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6,9 12,15 18,9" /></svg>
                    </button>
                    <button onClick={() => removeStep(step.id)} className="text-text-secondary hover:text-status-fail p-1" title="Remove step">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    {step.operations.map((op) => (
                      <div key={op.id} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-2.5">
                        <input
                          className="font-body text-body font-medium text-text-primary bg-transparent border-none focus:outline-none flex-1 placeholder:text-text-secondary/40"
                          value={op.name}
                          onChange={e => updateOpName(step.id, op.id, e.target.value)}
                          placeholder="Operation name"
                        />
                        <button onClick={() => removeOperation(step.id, op.id)} className="text-text-secondary hover:text-status-fail shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}

                    <button onClick={() => addOperation(step.id)} className="font-body text-small text-text-secondary hover:text-text-primary transition-colors">
                      + Add Operation
                    </button>

                    {availableMeasurements.length > 0 && (
                      <details className="text-small">
                        <summary className="font-body text-tiny font-medium text-text-secondary cursor-pointer hover:text-text-primary">
                          Measurement Assignments ({step.operations.reduce((sum, o) => sum + o.measurement_ids.length, 0)})
                        </summary>
                        <div className="mt-2 space-y-1">
                          {step.operations.map(op => (
                            <div key={op.id} className="pl-2 border-l-2 border-border-light">
                              <p className="font-body text-tiny font-medium text-text-primary mb-1">{op.name || 'Unnamed'}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {availableMeasurements.map(m => {
                                  const selected = op.measurement_ids.includes(m.id);
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => toggleOpMeasurement(step.id, op.id, m.id)}
                                      className={`font-body text-tiny px-2 py-0.5 rounded-full border transition-all ${
                                        selected
                                          ? 'bg-text-primary text-white border-text-primary'
                                          : 'bg-surface text-text-secondary border-border-light hover:border-text-primary/30'
                                      }`}
                                    >
                                      {m.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button onClick={addStep} className="btn-secondary">
            + Add Station
          </button>
        </>
      )}

      {dirty && (
        <div className="fixed bottom-8 right-8 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary shadow-elevated">
            {saving ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      )}
    </div>
  );
}
