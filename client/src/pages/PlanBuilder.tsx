import { useState, useEffect } from 'react';
import { getPlans, getPlan, createPlan, deletePlan, addFlowStep, removeFlowStep, moveFlowStep, addFlowStepOperation, removeFlowStepOperation, addDimension, removeDimension } from '../data/service';
import { getAvailableComponents, getMachines } from '../data/service';
import Modal from '../components/common/Modal';
import type { InspectionPlan, FlowStep, Operation, Dimension, Component, Machine } from '../../../shared/types';
import { motion } from 'framer-motion';

const typeBadge: Record<string, string> = {
  inspection: 'bg-status-info/8 text-status-info border-status-info/20',
  production: 'bg-status-info/8 text-status-info border-status-info/20',
  qr_marking: 'bg-status-warning/8 text-status-warning border-status-warning/20',
};

const typeLabel: Record<string, string> = {
  inspection: 'Inspection',
  production: 'Production',
  qr_marking: 'QR Marking',
};

export default function PlanBuilder() {
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);

  const [expandedOpId, setExpandedOpId] = useState<number | null>(null);
  const [addingOpStepId, setAddingOpStepId] = useState<number | null>(null);
  const [newOpName, setNewOpName] = useState('');
  const [addingDimOpId, setAddingDimOpId] = useState<number | null>(null);
  const [newDim, setNewDim] = useState({ dimension_name: '', nominal: '', min_limit: '', max_limit: '', unit: 'mm' });

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanComponentId, setNewPlanComponentId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [p, c, m] = await Promise.all([getPlans(), getAvailableComponents(), getMachines()]);
    setPlans(p);
    setComponents(c);
    setMachines(m);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedPlanId) {
      getPlan(selectedPlanId).then(p => { if (p) setSelectedPlan({ ...p }); });
    } else {
      setSelectedPlan(null);
    }
  }, [selectedPlanId, plans]);

  async function handleCreatePlan() {
    if (!newPlanName.trim() || newPlanComponentId === null) return;
    const plan = await createPlan(newPlanName.trim(), newPlanComponentId);
    setPlans(p => [...p, plan]);
    setSelectedPlanId(plan.id);
    setShowNewPlanModal(false);
    setNewPlanName('');
    setNewPlanComponentId(null);
  }

  async function handleDeletePlan(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this machine folder and all its flow data?')) return;
    await deletePlan(id);
    setPlans(p => p.filter(pl => pl.id !== id));
    if (selectedPlanId === id) { setSelectedPlanId(null); setSelectedPlan(null); }
  }

  function openMachineModal() {
    setSelectedMachineId(null);
    setShowMachineModal(true);
  }

  async function handleAddMachine() {
    if (!selectedPlan || selectedMachineId === null) return;
    await addFlowStep(selectedPlan.id, selectedMachineId);
    setShowMachineModal(false);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleRemoveStep(stepId: number) {
    if (!selectedPlan) return;
    if (!confirm('Remove this machine and all its operations from the flow?')) return;
    await removeFlowStep(selectedPlan.id, stepId);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleMoveStep(stepId: number, dir: 'up' | 'down') {
    if (!selectedPlan) return;
    await moveFlowStep(selectedPlan.id, stepId, dir);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleAddOperation(stepId: number) {
    if (!newOpName.trim() || !selectedPlan) return;
    await addFlowStepOperation(stepId, newOpName.trim());
    setAddingOpStepId(null);
    setNewOpName('');
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleRemoveOp(stepId: number, opId: number) {
    if (!selectedPlan) return;
    await removeFlowStepOperation(stepId, opId);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleAddDim(opId: number) {
    if (!newDim.dimension_name.trim() || !selectedPlan) return;
    await addDimension(opId, {
      dimension_name: newDim.dimension_name, nominal: parseFloat(newDim.nominal) || 0,
      min_limit: parseFloat(newDim.min_limit) || 0, max_limit: parseFloat(newDim.max_limit) || 0,
      unit: newDim.unit, gauge_id: null, station_id: null,
    });
    setAddingDimOpId(null);
    setNewDim({ dimension_name: '', nominal: '', min_limit: '', max_limit: '', unit: 'mm' });
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleRemoveDim(opId: number, dimId: number) {
    if (!selectedPlan) return;
    await removeDimension(opId, dimId);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  const compName = (id: number) => components.find(c => c.id === id)?.part_code || `#${id}`;
  const machineName = (id: number) => machines.find(m => m.id === id)?.name || `Machine #${id}`;
  const machineInfo = (id: number) => {
    const m = machines.find(m => m.id === id);
    return m ? { code: m.machine_code, type: m.machine_type } : { code: '', type: '' as const };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-heading font-semibold text-small text-text-secondary tracking-wide uppercase mb-1">Flow Designer</p>
          <h1 className="font-heading font-semibold text-title text-text-primary">Manufacturing Flow Designer</h1>
        </div>
        <button onClick={() => { setShowNewPlanModal(true); setNewPlanName(''); setNewPlanComponentId(null); }} className="btn-primary">+ New Plan</button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 space-y-1 overflow-y-auto pr-2">
          <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider mb-3">Plans</p>
          {plans.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl font-body text-body transition-all cursor-pointer group flex items-center justify-between ${
                selectedPlanId === p.id
                  ? 'bg-neutral-100 text-text-primary'
                  : 'text-text-secondary hover:bg-neutral-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{p.name}</p>
                <p className="font-body text-tiny text-text-secondary mt-0.5 truncate">{compName(p.component_id)} · {p.flow_steps.length} machines</p>
              </div>
              <button
                onClick={e => handleDeletePlan(p.id, e)}
                className="text-text-secondary/40 hover:text-status-fail opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2 p-0.5"
                title="Delete folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-text-secondary text-body text-center py-8">No plans yet. Create your first one.</p>
          )}
        </aside>

        {/* Flow canvas */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlan ? (
            <div className="bg-surface rounded-3xl shadow-card text-center py-20">
              <p className="font-body text-section text-text-secondary">Select a plan to design its flow</p>
              <p className="font-body text-body text-text-secondary mt-1">Or create a new plan</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Plan header */}
              <div className="bg-surface rounded-3xl p-6 shadow-card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider">Plan</p>
                    <p className="font-heading font-semibold text-section text-text-primary">{selectedPlan.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body text-small text-text-secondary">{compName(selectedPlan.component_id)}</span>
                      <span className="text-text-secondary/40">·</span>
                      <span className="font-body text-small text-text-secondary">Rev {selectedPlan.revision}</span>
                    </div>
                  </div>
                  <span className="font-body text-tiny font-semibold px-3 py-1.5 rounded-full bg-status-pass/8 text-status-pass border border-status-pass/20">
                    {selectedPlan.is_active ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Flow */}
              <div className="relative pb-8">
                {/* START */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-status-pass/10 border-2 border-status-pass flex items-center justify-center shrink-0">
                    <span className="text-status-pass font-heading font-bold text-lg">S</span>
                  </div>
                  <span className="font-heading font-semibold text-small text-status-pass uppercase tracking-wider">START</span>
                </div>

                {selectedPlan.flow_steps.map((step, stepIdx) => (
                  <motion.div key={step.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stepIdx * 0.05 }}>
                    <div className="ml-[19px] w-0.5 h-6 bg-border" />

                    <div className="bg-surface rounded-3xl p-6 shadow-card mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-tiny font-bold border ${
                            typeBadge[machineInfo(step.machine_id).type] || 'bg-neutral-100 text-text-secondary border-border'
                          }`}>
                            {stepIdx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-heading font-semibold text-card-title text-text-primary">{machineName(step.machine_id)}</p>
                              <span className={`font-body text-tiny font-medium px-1.5 py-0.5 rounded-full border ${
                                typeBadge[machineInfo(step.machine_id).type] || 'bg-neutral-100 text-text-secondary'
                              }`}>
                                {typeLabel[machineInfo(step.machine_id).type] || machineInfo(step.machine_id).type}
                              </span>
                            </div>
                            <p className="font-body text-tiny text-text-secondary">{machineInfo(step.machine_id).code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleMoveStep(step.id, 'up')} disabled={stepIdx === 0}
                            className="text-text-secondary hover:text-text-primary disabled:opacity-30 font-body text-body px-1">&uarr;</button>
                          <button onClick={() => handleMoveStep(step.id, 'down')} disabled={stepIdx === selectedPlan.flow_steps.length - 1}
                            className="text-text-secondary hover:text-text-primary disabled:opacity-30 font-body text-body px-1">&darr;</button>
                          <button onClick={() => handleRemoveStep(step.id)} className="font-body text-small text-status-fail/60 hover:text-status-fail ml-2">Remove</button>
                        </div>
                      </div>

                      {/* Operations */}
                      <div className="space-y-2 pl-11">
                        {step.operations.map(op => (
                          <div key={op.id}>
                            <div
                              className="flex items-center gap-2 py-2.5 px-4 rounded-2xl hover:bg-neutral-50 cursor-pointer group border border-transparent hover:border-border-light transition-all"
                              onClick={() => setExpandedOpId(expandedOpId === op.id ? null : op.id)}
                            >
                              <span className="w-2 h-2 rounded-full bg-text-primary/40 shrink-0" />
                              <span className="font-body text-body text-text-primary flex-1">{op.operation_name}</span>
                              <span className="font-body text-tiny text-text-secondary">{op.dimensions.length} dim{op.dimensions.length !== 1 ? 's' : ''}</span>
                              <button onClick={e => { e.stopPropagation(); handleRemoveOp(step.id, op.id); }}
                                className="text-status-fail/40 hover:text-status-fail font-body text-tiny opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                            </div>

                            {expandedOpId === op.id && (
                              <div className="ml-4 pl-3 border-l-2 border-border-light space-y-2 py-2">
                                {op.dimensions.map(dim => (
                                  <div key={dim.id} className="bg-neutral-50 rounded-2xl p-4 font-body text-body">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-text-primary">{dim.dimension_name}</span>
                                      <button onClick={() => handleRemoveDim(op.id, dim.id)}
                                        className="text-status-fail/50 hover:text-status-fail font-body text-tiny">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 text-small">
                                      <div><span className="text-text-secondary">Nominal</span><p className="font-mono text-text-primary mt-0.5">{dim.nominal.toFixed(3)}</p></div>
                                      <div><span className="text-text-secondary">Min</span><p className="font-mono text-status-fail mt-0.5">{dim.min_limit.toFixed(3)}</p></div>
                                      <div><span className="text-text-secondary">Max</span><p className="font-mono text-status-pass mt-0.5">{dim.max_limit.toFixed(3)}</p></div>
                                      <div><span className="text-text-secondary">Unit</span><p className="text-text-primary mt-0.5">{dim.unit}</p></div>
                                    </div>
                                  </div>
                                ))}

                                {addingDimOpId === op.id ? (
                                  <div className="bg-neutral-50 rounded-2xl p-5 border border-border-light space-y-3">
                                    <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider">New Dimension</p>
                                    <div className="grid grid-cols-5 gap-2">
                                      <input className="input text-small py-2 col-span-2" placeholder="Dimension name" value={newDim.dimension_name}
                                        onChange={e => setNewDim(d => ({ ...d, dimension_name: e.target.value }))} />
                                      <input className="input text-small py-2" placeholder="Nominal" type="number" step="0.001" value={newDim.nominal}
                                        onChange={e => setNewDim(d => ({ ...d, nominal: e.target.value }))} />
                                      <input className="input text-small py-2" placeholder="Min limit" type="number" step="0.001" value={newDim.min_limit}
                                        onChange={e => setNewDim(d => ({ ...d, min_limit: e.target.value }))} />
                                      <input className="input text-small py-2" placeholder="Max limit" type="number" step="0.001" value={newDim.max_limit}
                                        onChange={e => setNewDim(d => ({ ...d, max_limit: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleAddDim(op.id)} className="btn-primary text-small py-2 px-4">Add Dimension</button>
                                      <button onClick={() => setAddingDimOpId(null)} className="btn-ghost text-small py-2">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingDimOpId(op.id)}
                                    className="font-body text-tiny text-text-secondary hover:text-text-primary transition-colors py-1.5">
                                    + Add Dimension
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {addingOpStepId === step.id ? (
                          <div className="bg-neutral-50 rounded-2xl p-5 border border-border-light space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-text-primary font-heading text-section">+</span>
                              <span className="font-heading font-semibold text-card-title text-text-primary">New Operation</span>
                            </div>
                            <div>
                              <label className="font-body text-tiny text-text-secondary block mb-1.5">Operation Name</label>
                              <input className="input w-full" placeholder="e.g. Rough Facing, Drilling, Final Inspection"
                                value={newOpName}
                                onChange={e => setNewOpName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddOperation(step.id)}
                                autoFocus />
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                              <button onClick={() => handleAddOperation(step.id)} disabled={!newOpName.trim()} className="btn-primary text-small py-2 px-5 disabled:opacity-50">Add Operation</button>
                              <button onClick={() => { setAddingOpStepId(null); setNewOpName(''); }} className="font-body text-small text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingOpStepId(step.id); setNewOpName(''); }}
                            className="flex items-center gap-2 font-body text-small text-text-secondary hover:text-text-primary transition-colors py-2.5 px-4 border-2 border-dashed border-border rounded-2xl hover:border-text-primary/30 w-full justify-center">
                            <span className="text-lg leading-none">+</span>
                            <span>Add Operation</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="ml-[19px] w-0.5 h-6 bg-border" />

                    {stepIdx < selectedPlan.flow_steps.length - 1 ? (
                      <div className="flex justify-center mb-2">
                        <button onClick={() => openMachineModal()}
                          className="w-8 h-8 rounded-full border-2 border-dashed border-border text-text-secondary hover:border-text-primary hover:text-text-primary flex items-center justify-center text-lg transition-all">
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center mb-2">
                        <button onClick={() => openMachineModal()}
                          className="flex items-center gap-2 font-body text-small text-text-secondary hover:text-text-primary transition-colors py-2.5 px-4 border-2 border-dashed border-border rounded-2xl hover:border-text-primary/30">
                          <span className="text-lg leading-none">+</span>
                          <span>Add Next Machine</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}

                {selectedPlan.flow_steps.length === 0 && (
                  <div className="ml-[19px] pl-8 py-8">
                    <button onClick={() => openMachineModal()}
                      className="flex items-center gap-2 font-body text-small text-text-secondary hover:text-text-primary transition-colors py-3 px-5 border-2 border-dashed border-border rounded-2xl hover:border-text-primary/30">
                      <span className="text-lg leading-none">+</span>
                      <span>Add First Machine</span>
                    </button>
                  </div>
                )}

                {/* END */}
                <div className="ml-[19px] pl-0 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-border flex items-center justify-center shrink-0">
                      <span className="text-text-secondary font-heading font-bold text-lg">E</span>
                    </div>
                    <span className="font-heading font-semibold text-small text-text-secondary uppercase tracking-wider">END</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showNewPlanModal} onClose={() => setShowNewPlanModal(false)} title="New Plan">
        <div className="space-y-4">
          <div>
            <label className="label">Plan Name</label>
            <input className="input w-full" placeholder="e.g. Bushing Precision Line"
              value={newPlanName} onChange={e => setNewPlanName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newPlanName.trim() && newPlanComponentId !== null && handleCreatePlan()} autoFocus />
          </div>
          <div>
            <label className="label">Component</label>
            <select className="input w-full" value={newPlanComponentId ?? ''} onChange={e => setNewPlanComponentId(Number(e.target.value))}>
              <option value="" disabled>Select a component</option>
              {components.map(c => (<option key={c.id} value={c.id}>{c.part_code} — {c.description}</option>))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowNewPlanModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreatePlan} disabled={!newPlanName.trim() || newPlanComponentId === null} className="btn-primary flex-1 disabled:opacity-50">Create Plan</button>
          </div>
        </div>
      </Modal>

      <Modal open={showMachineModal} onClose={() => setShowMachineModal(false)} title="Add Machine to Flow">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {machines.map(m => (
            <button key={m.id} onClick={() => setSelectedMachineId(m.id)}
              className={`w-full text-left p-4 rounded-2xl font-body text-body transition-all ${
                selectedMachineId === m.id ? 'bg-neutral-100 text-text-primary border border-border' : 'bg-neutral-50 text-text-secondary border border-transparent hover:bg-neutral-100'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="font-body text-tiny text-text-secondary">{m.machine_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-tiny px-2 py-0.5 rounded-full border ${typeBadge[m.machine_type] || 'bg-neutral-100 text-text-secondary'}`}>
                    {typeLabel[m.machine_type] || m.machine_type}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${m.status === 'running' ? 'bg-status-pass' : m.status === 'idle' ? 'bg-status-warning' : 'bg-status-fail'}`} />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border-light">
          <button onClick={() => setShowMachineModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAddMachine} disabled={selectedMachineId === null} className="btn-primary flex-1">
            {selectedMachineId === null ? 'Select a Machine' : `Add ${machineName(selectedMachineId)}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
