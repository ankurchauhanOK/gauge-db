import type {
  ProductionRecord,
  InspectionPlan,
  Operation,
  Dimension,
  InspectionResult,
} from '../../../shared/types';
import {
  mockComponents,
  mockPlans,
  mockMachines,
  operatorDashboardMock,
  getCurrentShift,
  createMockRecord,
  createMockResult,
  searchHistoryMock,
  generateSerial,
} from './mock';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let activeRecord: ProductionRecord | null = null;
let activePlan: InspectionPlan | null = null;
let currentOpIndex = 0;
let completedResults: InspectionResult[] = [];
let serialCounter = 0;

export function resetInspection() {
  activeRecord = null;
  activePlan = null;
  currentOpIndex = 0;
  completedResults = [];
}

export async function getDashboard() {
  await delay(400);
  return {
    todayProduction: operatorDashboardMock.todayProduction,
    accepted: operatorDashboardMock.accepted,
    rejected: operatorDashboardMock.rejected,
    target: operatorDashboardMock.target,
    qualityPercentage: operatorDashboardMock.qualityPercentage,
    machineStatus: operatorDashboardMock.machineStatus,
    shift: getCurrentShift(),
  };
}

export async function startProcess(componentId: number, machineId: number, operatorName: string) {
  await delay(800);
  serialCounter++;
  const serial = `SB${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(serialCounter).padStart(4, '0')}`;
  const comp = mockComponents.find(c => c.id === componentId)!;
  const machine = mockMachines.find(m => m.id === machineId)!;
  const plan = mockPlans.find(p => p.component_id === componentId)!;

  activeRecord = {
    id: Date.now(),
    serial_number: serial,
    component_id: componentId,
    part_code: comp.part_code,
    machine_id: machineId,
    operator_id: 1,
    status: 'in_progress',
    current_operation: 1,
    rejection_reason: null,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  activePlan = plan;
  currentOpIndex = 0;
  completedResults = [];

  return {
    record: activeRecord,
    component: comp,
    machine: machine,
    plan: plan,
    currentOperation: plan.operations[0],
  };
}

export async function getInspectionData(serial: string) {
  await delay(300);
  if (!activeRecord || !activePlan) throw new Error('No active inspection');
  const currentOp = activePlan.operations[currentOpIndex];
  return {
    record: activeRecord,
    component: mockComponents.find(c => c.id === activeRecord!.component_id)!,
    machine: mockMachines.find(m => m.id === activeRecord!.machine_id)!,
    currentOperation: currentOp,
    operationIndex: currentOpIndex,
    totalOperations: activePlan.operations.length,
    completedResults,
    status: activeRecord.status,
  };
}

export async function submitMeasurement(
  dimension: Dimension,
  measuredValue: number,
): Promise<{ result: InspectionResult; nextOperation: Operation | null; isComplete: boolean; finalStatus: string }> {
  await delay(400);
  if (!activeRecord || !activePlan) throw new Error('No active inspection');

  const currentOp = activePlan.operations[currentOpIndex];
  const passed = measuredValue >= dimension.min_limit && measuredValue <= dimension.max_limit;
  const result = createMockResult(activeRecord.id, dimension, currentOp.id, measuredValue, passed ? 'PASS' : 'FAIL');
  completedResults.push(result);

  if (!passed) {
    activeRecord.status = 'rejected';
    activeRecord.rejection_reason = `${dimension.dimension_name} Out of Tolerance`;
    activeRecord.completed_at = new Date().toISOString();
    return { result, nextOperation: null, isComplete: true, finalStatus: 'rejected' };
  }

  currentOpIndex++;
  if (currentOpIndex >= activePlan.operations.length) {
    activeRecord.status = 'accepted';
    activeRecord.completed_at = new Date().toISOString();
    return { result, nextOperation: null, isComplete: true, finalStatus: 'accepted' };
  }

  const nextOp = activePlan.operations[currentOpIndex];
  activeRecord.current_operation = currentOpIndex + 1;
  return { result, nextOperation: nextOp, isComplete: false, finalStatus: 'in_progress' };
}

export async function getOperatorSearch(query: string) {
  await delay(500);
  const q = query.toLowerCase();
  return searchHistoryMock.filter(r =>
    r.serial_number.toLowerCase().includes(q) ||
    r.part_code.toLowerCase().includes(q)
  );
}

export function getAvailableComponents() {
  return mockComponents.filter(c => c.status === 'active');
}

export function getAvailablePlans() {
  return mockPlans;
}
