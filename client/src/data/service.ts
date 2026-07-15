import type {
  ProductionRecord,
  InspectionPlan,
  Operation,
  Dimension,
  InspectionResult,
  Component,
  Machine,
  Gauge,
  User,
  UserRole,
} from '../../../shared/types';
import {
  mockComponents,
  mockPlans,
  mockMachines,
  mockGauges,
  mockUsers,
  operatorDashboardMock,
  adminDashboardMock,
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

// ============ Admin Dashboard ============
export async function getAdminDashboard() {
  await delay(400);
  return adminDashboardMock;
}

// ============ Components CRUD ============
let componentIdCounter = 10;

export async function getComponents() {
  await delay(300);
  return [...mockComponents];
}

export async function createComponent(data: { part_code: string; description: string; customer: string }) {
  await delay(500);
  componentIdCounter++;
  const comp: Component = {
    id: componentIdCounter,
    part_code: data.part_code,
    description: data.description,
    customer: data.customer,
    revision: 1,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockComponents.push(comp);
  return comp;
}

export async function updateComponent(id: number, data: Partial<Component>) {
  await delay(400);
  const idx = mockComponents.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Component not found');
  Object.assign(mockComponents[idx], data, { updated_at: new Date().toISOString() });
  return mockComponents[idx];
}

export async function deleteComponent(id: number) {
  await delay(300);
  const idx = mockComponents.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Component not found');
  mockComponents.splice(idx, 1);
}

// ============ Inspection Plans CRUD ============
let planIdCounter = 10;
let opIdCounter = 20;
let dimIdCounter = 30;

export async function getPlans() {
  await delay(300);
  return [...mockPlans];
}

export async function getPlan(id: number) {
  await delay(200);
  return mockPlans.find(p => p.id === id);
}

export async function createPlan(componentId: number) {
  await delay(500);
  planIdCounter++;
  const plan: InspectionPlan = {
    id: planIdCounter,
    component_id: componentId,
    revision: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    operations: [],
  };
  mockPlans.push(plan);
  return plan;
}

export async function addOperation(planId: number, name: string) {
  await delay(300);
  const plan = mockPlans.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  opIdCounter++;
  const op: Operation = {
    id: opIdCounter,
    inspection_plan_id: planId,
    operation_order: plan.operations.length + 1,
    operation_name: name,
    dimensions: [],
  };
  plan.operations.push(op);
  return op;
}

export async function removeOperation(planId: number, operationId: number) {
  await delay(200);
  const plan = mockPlans.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  const idx = plan.operations.findIndex(o => o.id === operationId);
  if (idx > -1) plan.operations.splice(idx, 1);
  plan.operations.forEach((o, i) => { o.operation_order = i + 1; });
}

export async function addDimension(
  operationId: number,
  data: { dimension_name: string; nominal: number; min_limit: number; max_limit: number; unit: string; gauge_id: number | null; station_id: number | null },
) {
  await delay(300);
  dimIdCounter++;
  const dim: Dimension = { id: dimIdCounter, operation_id: operationId, ...data };
  // Find the operation and push
  for (const plan of mockPlans) {
    const op = plan.operations.find(o => o.id === operationId);
    if (op) { op.dimensions.push(dim); break; }
  }
  return dim;
}

export async function updateDimension(operationId: number, dimensionId: number, data: Partial<Dimension>) {
  await delay(200);
  for (const plan of mockPlans) {
    const op = plan.operations.find(o => o.id === operationId);
    if (op) {
      const dim = op.dimensions.find(d => d.id === dimensionId);
      if (dim) { Object.assign(dim, data); return dim; }
    }
  }
  throw new Error('Dimension not found');
}

export async function removeDimension(operationId: number, dimensionId: number) {
  await delay(200);
  for (const plan of mockPlans) {
    const op = plan.operations.find(o => o.id === operationId);
    if (op) {
      const idx = op.dimensions.findIndex(d => d.id === dimensionId);
      if (idx > -1) { op.dimensions.splice(idx, 1); return; }
    }
  }
}

// ============ Machines CRUD ============
let machineIdCounter = 10;

export async function getMachines() {
  await delay(300);
  return [...mockMachines];
}

export async function createMachine(data: { machine_code: string; name: string; ip_address: string; machine_type: string }) {
  await delay(500);
  machineIdCounter++;
  const m: Machine = {
    id: machineIdCounter,
    machine_code: data.machine_code,
    name: data.name,
    ip_address: data.ip_address,
    machine_type: data.machine_type as Machine['machine_type'],
    status: 'idle',
  };
  mockMachines.push(m);
  return m;
}

export async function updateMachine(id: number, data: Partial<Machine>) {
  await delay(400);
  const idx = mockMachines.findIndex(m => m.id === id);
  if (idx === -1) throw new Error('Machine not found');
  Object.assign(mockMachines[idx], data);
  return mockMachines[idx];
}

// ============ Gauges CRUD ============
let gaugeIdCounter = 10;

export async function getGauges() {
  await delay(300);
  return [...mockGauges];
}

export async function createGauge(data: { gauge_name: string; interface_type: string; connection_config: Record<string, unknown> }) {
  await delay(500);
  gaugeIdCounter++;
  const g: Gauge = {
    id: gaugeIdCounter,
    gauge_name: data.gauge_name,
    interface_type: data.interface_type as Gauge['interface_type'],
    connection_config: data.connection_config,
    calibration_date: null,
    calibration_due: null,
    is_active: true,
  };
  mockGauges.push(g);
  return g;
}

export async function updateGauge(id: number, data: Partial<Gauge>) {
  await delay(400);
  const idx = mockGauges.findIndex(g => g.id === id);
  if (idx === -1) throw new Error('Gauge not found');
  Object.assign(mockGauges[idx], data);
  return mockGauges[idx];
}

// ============ Users CRUD ============
let userIdCounter = 10;

export async function getUsers() {
  await delay(300);
  return mockUsers.map(({ password, ...u }) => u);
}

export async function createUser(data: { username: string; name: string; role: UserRole }) {
  await delay(500);
  userIdCounter++;
  const u: User = { id: userIdCounter, username: data.username, name: data.name, role: data.role, is_active: true };
  mockUsers.push({ ...u, password: 'default123' });
  return u;
}

export async function updateUser(id: number, data: Partial<User>) {
  await delay(400);
  const idx = mockUsers.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  Object.assign(mockUsers[idx], data);
  const { password, ...rest } = mockUsers[idx];
  return rest;
}

export async function deleteUser(id: number) {
  await delay(300);
  const idx = mockUsers.findIndex(u => u.id === id);
  if (idx > -1) mockUsers.splice(idx, 1);
}
