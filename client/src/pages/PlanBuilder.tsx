import { useState, useEffect } from 'react';
import { getPlans, getPlan, createPlan, addOperation, removeOperation, addDimension, removeDimension } from '../data/service';
import { getAvailableComponents } from '../data/service';
import type { InspectionPlan, Component } from '../../../shared/types';

export default function PlanBuilder() {
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([getPlans(), getAvailableComponents()]);
    setPlans(p);
    setComponents(c);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedPlanId) {
      getPlan(selectedPlanId).then(plan => { if (plan) setSelectedPlan(plan); });
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

  async function handleAddOp() {
    if (!selectedPlan) return;
    const name = prompt('Operation name:');
    if (!name) return;
    await addOperation(selectedPlan.id, name);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleRemoveOp(opId: number) {
    if (!selectedPlan) return;
    if (!confirm('Remove this operation and all its dimensions?')) return;
    await removeOperation(selectedPlan.id, opId);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleAddDim(opId: number) {
    if (!selectedPlan) return;
    const name = prompt('Dimension name:');
    if (!name) return;
    const nom = parseFloat(prompt('Nominal value:') || '0');
    const min = parseFloat(prompt('Min limit:') || '0');
    const max = parseFloat(prompt('Max limit:') || '0');
    await addDimension(opId, { dimension_name: name, nominal: nom, min_limit: min, max_limit: max, unit: 'mm', gauge_id: null, station_id: null });
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  async function handleRemoveDim(opId: number, dimId: number) {
    if (!selectedPlan) return;
    await removeDimension(opId, dimId);
    const updated = await getPlan(selectedPlan.id);
    if (updated) setSelectedPlan({ ...updated });
  }

  const componentName = (id: number) => components.find(c => c.id === id)?.part_code || `Component #${id}`;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inspection Plan Builder</h1>
        <button onClick={handleCreatePlan} className="btn-primary">+ New Plan</button>
      </div>

      <div className="flex gap-6">
        <div className="w-72 shrink-0 space-y-2">
          <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">Plans</p>
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
              <p className="font-medium">{componentName(p.component_id)}</p>
              <p className="text-xs text-surface-500 mt-0.5">Rev {p.revision} · {p.operations.length} operations</p>
            </button>
          ))}
        </div>

        <div className="flex-1">
          {!selectedPlan ? (
            <div className="card text-center py-16">
              <p className="text-surface-400 text-lg">Select a plan to edit</p>
              <p className="text-surface-500 text-sm mt-1">Or create a new plan</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider">Plan</p>
                    <p className="text-lg font-bold text-white">{componentName(selectedPlan.component_id)}</p>
                    <p className="text-sm text-surface-400">Revision {selectedPlan.revision}</p>
                  </div>
                  <button onClick={handleAddOp} className="btn-secondary text-sm">+ Add Operation</button>
                </div>
              </div>

              {/* Visual workflow */}
              <div className="relative">
                {selectedPlan.operations.map((op, opIdx) => (
                  <div key={op.id} className="relative pb-6">
                    {/* Vertical connector line */}
                    {opIdx < selectedPlan.operations.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-surface-700" />
                    )}

                    <div className="card relative">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gauge-blue/10 border-2 border-gauge-blue/30 flex items-center justify-center text-gauge-blue font-bold shrink-0">
                          {op.operation_order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-surface-500 uppercase">Operation {op.operation_order}</p>
                            <button onClick={() => handleRemoveOp(op.id)} className="text-xs text-gauge-red/60 hover:text-gauge-red transition-colors">Remove</button>
                          </div>
                          <p className="text-base font-semibold text-white">{op.operation_name}</p>
                        </div>
                        <button onClick={() => handleAddDim(op.id)} className="btn-ghost text-xs">+ Dimension</button>
                      </div>

                      {/* Dimensions grid */}
                      {op.dimensions.length > 0 ? (
                        <div className="grid grid-cols-6 gap-2 text-sm bg-surface-800/50 rounded-lg p-3">
                          <div className="text-xs text-surface-500 font-medium">Dimension</div>
                          <div className="text-xs text-surface-500 font-medium">Nominal</div>
                          <div className="text-xs text-surface-500 font-medium">Min</div>
                          <div className="text-xs text-surface-500 font-medium">Max</div>
                          <div className="text-xs text-surface-500 font-medium">Unit</div>
                          <div className="text-xs text-surface-500 font-medium" />
                          {op.dimensions.map(dim => (
                            <>
                              <div className="text-surface-200 truncate">{dim.dimension_name}</div>
                              <div className="font-mono text-surface-300">{dim.nominal.toFixed(3)}</div>
                              <div className="font-mono text-gauge-red">{dim.min_limit.toFixed(3)}</div>
                              <div className="font-mono text-gauge-green">{dim.max_limit.toFixed(3)}</div>
                              <div className="text-surface-400">{dim.unit}</div>
                              <div className="flex gap-2">
                                <button onClick={() => handleRemoveDim(op.id, dim.id)} className="text-xs text-gauge-red/60 hover:text-gauge-red">Remove</button>
                              </div>
                            </>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-surface-500 italic pl-14">No dimensions defined. Click "+ Dimension" to add.</p>
                      )}
                    </div>
                  </div>
                ))}

                {selectedPlan.operations.length === 0 && (
                  <div className="card text-center py-8">
                    <p className="text-surface-400">No operations yet</p>
                    <button onClick={handleAddOp} className="btn-ghost text-sm mt-2">+ Add First Operation</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
