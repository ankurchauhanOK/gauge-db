import { useState, useEffect } from 'react';
import { getPlans, getPlan, createPlan, addFlowStep, removeFlowStep, moveFlowStep, addFlowStepOperation, removeFlowStepOperation, addDimension, removeDimension } from '../data/service';
import { getAvailableComponents, getMachines } from '../data/service';
import Modal from '../components/common/Modal';
import type { InspectionPlan, FlowStep, Operation, Dimension, Component, Machine } from '../../../shared/types';

export default function PlanBuilder() {
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machineModalTargetIdx, setMachineModalTargetIdx] = useState<number | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);

  const [expandedOpId, setExpandedOpId] = useState<number | null>(null);
  const [addingOpStepId, setAddingOpStepId] = useState<number | null>(null);
  const [newOpName, setNewOpName] = useState('');
  const [addingDimOpId, setAddingDimOpId] = useState<number | null>(null);
  const [newDim, setNewDim] = useState({ dimension_name: '', nominal: '', min_limit: '', max_limit: '', unit: 'mm' });

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
    const first = components[0];
    if (!first) return;
    const plan = await createPlan(first.id);
    setPlans(p => [...p, plan]);
    setSelectedPlanId(plan.id);
  }

  function openMachineModal(afterIdx?: number) {
    setMachineModalTargetIdx(afterIdx ?? null);
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
      dimension_name: newDim.dimension_name,
      nominal: parseFloat(newDim.nominal) || 0,
      min_limit: parseFloat(newDim.min_limit) || 0,
      max_limit: parseFloat(newDim.max_limit) || 0,
      unit: newDim.unit,
      gauge_id: null,
      station_id: null,
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

  const machineTypeBadge: Record<string, string> = {
    inspection: 'bg-gauge-green/10 text-gauge-green border-gauge-green/30',
    production: 'bg-gauge-blue/10 text-gauge-blue border-gauge-blue/30',
    qr_marking: 'bg-gauge-amber/10 text-gauge-amber border-gauge-amber/30',
  };
  const machineTypeLabel: Record<string, string> = {
    inspection: 'Inspection',
    production: 'Production',
    qr_marking: 'QR Marking',
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Manufacturing Flow Designer</h1>
        <button onClick={handleCreatePlan} className="btn-primary">+ New Plan</button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Plan list */}
        <aside className="w-64 shrink-0 space-y-2 overflow-y-auto">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-medium mb-3">Inspection Plans</p>
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                selectedPlanId === p.id
                  ? 'bg-gauge-blue/10 text-gauge-blue border border-gauge-blue/20'
                  : 'bg-surface-900 text-surface-300 hover:bg-surface-800 border border-transparent'
              }`}
            >
              <p className="font-medium">{compName(p.component_id)}</p>
              <p className="text-xs text-surface-500 mt-0.5">Rev {p.revision} · {p.flow_steps.length} machines</p>
            </button>
          ))}
        </aside>

        {/* Right: Flow designer */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlan ? (
            <div className="card text-center py-20">
              <p className="text-surface-400 text-lg">Select a plan to design its manufacturing flow</p>
              <p className="text-surface-500 text-sm mt-1">Or create a new plan</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Plan header */}
              <div className="card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider">Component</p>
                    <p className="text-xl font-bold text-white">{compName(selectedPlan.component_id)}</p>
                    <p className="text-sm text-surface-400">Revision {selectedPlan.revision}</p>
                  </div>
                  <span className="text-xs bg-gauge-green/10 text-gauge-green px-3 py-1 rounded-full border border-gauge-green/20">
                    {selectedPlan.is_active ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Flow canvas */}
              <div className="relative pb-8">
                {/* START node */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gauge-green/10 border-2 border-gauge-green flex items-center justify-center shrink-0">
                    <span className="text-gauge-green font-bold text-lg">S</span>
                  </div>
                  <span className="text-sm font-semibold text-gauge-green uppercase tracking-wider">START</span>
                </div>

                {/* Flow steps */}
                {selectedPlan.flow_steps.map((step, stepIdx) => (
                  <div key={step.id}>
                    {/* Connector */}
                    <div className="ml-[19px] w-0.5 h-6 bg-surface-600" />

                    {/* Machine card */}
                    <div className="card border border-surface-600 mb-2">
                      {/* Machine header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            machineTypeBadge[machineInfo(step.machine_id).type] || 'bg-surface-700 text-surface-400 border-surface-600'
                          }`}>
                            {stepIdx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-white">{machineName(step.machine_id)}</p>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                machineTypeBadge[machineInfo(step.machine_id).type] || 'bg-surface-700 text-surface-400'
                              }`}>
                                {machineTypeLabel[machineInfo(step.machine_id).type] || machineInfo(step.machine_id).type}
                              </span>
                            </div>
                            <p className="text-xs text-surface-500">{machineInfo(step.machine_id).code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleMoveStep(step.id, 'up')} disabled={stepIdx === 0}
                            className="text-surface-500 hover:text-white disabled:opacity-30 text-sm px-1">&uarr;</button>
                          <button onClick={() => handleMoveStep(step.id, 'down')} disabled={stepIdx === selectedPlan.flow_steps.length - 1}
                            className="text-surface-500 hover:text-white disabled:opacity-30 text-sm px-1">&darr;</button>
                          <button onClick={() => handleRemoveStep(step.id)} className="text-gauge-red/60 hover:text-gauge-red text-sm ml-2">Remove</button>
                        </div>
                      </div>

                      {/* Operations list */}
                      <div className="space-y-1.5 pl-11">
                        {step.operations.map(op => (
                          <div key={op.id}>
                            <div
                              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-800/50 cursor-pointer group"
                              onClick={() => setExpandedOpId(expandedOpId === op.id ? null : op.id)}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-surface-500 shrink-0" />
                              <span className="text-sm text-surface-200 flex-1">{op.operation_name}</span>
                              <span className="text-xs text-surface-500">{op.dimensions.length} dims</span>
                              <button onClick={e => { e.stopPropagation(); handleRemoveOp(step.id, op.id); }}
                                className="text-gauge-red/40 hover:text-gauge-red text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                            </div>

                            {/* Expanded dimensions */}
                            {expandedOpId === op.id && (
                              <div className="ml-4 pl-3 border-l-2 border-surface-700 space-y-2 py-2">
                                {op.dimensions.map(dim => (
                                  <div key={dim.id} className="bg-surface-800/50 rounded-lg p-2.5 text-sm">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="font-medium text-surface-200">{dim.dimension_name}</span>
                                      <button onClick={() => handleRemoveDim(op.id, dim.id)}
                                        className="text-gauge-red/50 hover:text-gauge-red text-xs">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                      <div><span className="text-surface-500">Nominal</span><p className="font-mono text-white">{dim.nominal.toFixed(3)}</p></div>
                                      <div><span className="text-surface-500">Min</span><p className="font-mono text-gauge-red">{dim.min_limit.toFixed(3)}</p></div>
                                      <div><span className="text-surface-500">Max</span><p className="font-mono text-gauge-green">{dim.max_limit.toFixed(3)}</p></div>
                                      <div><span className="text-surface-500">Unit</span><p className="text-surface-300">{dim.unit}</p></div>
                                    </div>
                                  </div>
                                ))}

                                {/* Add dimension inline */}
                                {addingDimOpId === op.id ? (
                                  <div className="bg-surface-800/50 rounded-lg p-2.5 space-y-2">
                                    <div className="grid grid-cols-5 gap-2">
                                      <input className="input text-xs py-1.5 col-span-2" placeholder="Name" value={newDim.dimension_name}
                                        onChange={e => setNewDim(d => ({ ...d, dimension_name: e.target.value }))} />
                                      <input className="input text-xs py-1.5" placeholder="Nominal" type="number" step="0.001" value={newDim.nominal}
                                        onChange={e => setNewDim(d => ({ ...d, nominal: e.target.value }))} />
                                      <input className="input text-xs py-1.5" placeholder="Min" type="number" step="0.001" value={newDim.min_limit}
                                        onChange={e => setNewDim(d => ({ ...d, min_limit: e.target.value }))} />
                                      <input className="input text-xs py-1.5" placeholder="Max" type="number" step="0.001" value={newDim.max_limit}
                                        onChange={e => setNewDim(d => ({ ...d, max_limit: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleAddDim(op.id)} className="btn-primary text-xs py-1.5 px-3">Save</button>
                                      <button onClick={() => setAddingDimOpId(null)} className="btn-ghost text-xs py-1.5">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingDimOpId(op.id)}
                                    className="text-xs text-surface-500 hover:text-gauge-blue transition-colors py-1">
                                    + Add Dimension
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add operation inline */}
                        {addingOpStepId === step.id ? (
                          <div className="flex gap-2 items-center py-1">
                            <input className="input text-sm py-1.5 flex-1" placeholder="Operation name"
                              value={newOpName} onChange={e => setNewOpName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddOperation(step.id)} autoFocus />
                            <button onClick={() => handleAddOperation(step.id)} className="btn-primary text-xs py-1.5 px-3">Add</button>
                            <button onClick={() => { setAddingOpStepId(null); setNewOpName(''); }} className="btn-ghost text-xs py-1.5">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAddingOpStepId(step.id); setNewOpName(''); }}
                            className="text-xs text-surface-500 hover:text-gauge-blue transition-colors py-1">
                            + Add Operation
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Connector after machine */}
                    <div className="ml-[19px] w-0.5 h-6 bg-surface-600" />

                    {/* Add machine button between steps */}
                    {stepIdx < selectedPlan.flow_steps.length - 1 ? (
                      <div className="flex justify-center mb-2">
                        <button onClick={() => openMachineModal(stepIdx + 1)}
                          className="w-8 h-8 rounded-full border-2 border-dashed border-surface-600 text-surface-500 hover:border-gauge-blue hover:text-gauge-blue flex items-center justify-center text-lg transition-all">
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center mb-2">
                        <button onClick={() => openMachineModal()}
                          className="flex items-center gap-2 text-sm text-surface-500 hover:text-gauge-blue transition-colors py-2 px-4 border-2 border-dashed border-surface-700 rounded-lg hover:border-gauge-blue/40">
                          <span className="text-lg leading-none">+</span>
                          <span>Add Next Machine</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {selectedPlan.flow_steps.length === 0 && (
                  <div className="ml-[19px] pl-8 py-8">
                    <button onClick={() => openMachineModal()}
                      className="flex items-center gap-2 text-sm text-surface-500 hover:text-gauge-blue transition-colors py-3 px-5 border-2 border-dashed border-surface-700 rounded-lg hover:border-gauge-blue/40">
                      <span className="text-lg leading-none">+</span>
                      <span>Add First Machine</span>
                    </button>
                  </div>
                )}

                {/* END node */}
                <div className="ml-[19px] pl-0 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-800 border-2 border-surface-600 flex items-center justify-center shrink-0">
                      <span className="text-surface-400 font-bold text-lg">E</span>
                    </div>
                    <span className="text-sm font-semibold text-surface-400 uppercase tracking-wider">END</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Machine Modal */}
      <Modal open={showMachineModal} onClose={() => setShowMachineModal(false)} title="Add Machine to Flow">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {machines.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMachineId(m.id)}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                selectedMachineId === m.id
                  ? 'bg-gauge-blue/10 border-gauge-blue/30 text-surface-200'
                  : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:bg-surface-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-surface-500">{m.machine_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    machineTypeBadge[m.machine_type] || 'bg-surface-700 text-surface-400'
                  }`}>
                    {machineTypeLabel[m.machine_type] || m.machine_type}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    m.status === 'running' ? 'bg-gauge-green' : m.status === 'idle' ? 'bg-gauge-amber' : 'bg-gauge-red'
                  }`} />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-surface-700">
          <button onClick={() => setShowMachineModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAddMachine} disabled={selectedMachineId === null} className="btn-primary flex-1">
            {selectedMachineId === null ? 'Select a Machine' : `Add ${machineName(selectedMachineId)}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
