import type {
  ProductionRecord,
  InspectionPlan,
  FlowStep,
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
let flowStepIdCounter = 20;
let opIdCounter = 100;
let dimIdCounter = 200;

export async function getPlans() {
  await delay(300);
  return [...mockPlans];
}

export async function getPlan(id: number) {
  await delay(200);
  return mockPlans.find(p => p.id === id);
}

export async function createPlan(name: string, componentId: number) {
  await delay(500);
  planIdCounter++;
  const plan: InspectionPlan = {
    id: planIdCounter,
    name,
    component_id: componentId,
    revision: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    operations: [],
    flow_steps: [],
  };
  mockPlans.push(plan);
  return plan;
}

export async function deletePlan(id: number) {
  await delay(200);
  const idx = mockPlans.findIndex(p => p.id === id);
  if (idx > -1) mockPlans.splice(idx, 1);
}

// ============ Flow Steps (Machine + Operations) ============
export async function addFlowStep(planId: number, machineId: number) {
  await delay(300);
  const plan = mockPlans.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  flowStepIdCounter++;
  const step: FlowStep = {
    id: flowStepIdCounter,
    inspection_plan_id: planId,
    machine_id: machineId,
    step_order: plan.flow_steps.length + 1,
    operations: [],
  };
  plan.flow_steps.push(step);
  return step;
}

export async function removeFlowStep(planId: number, flowStepId: number) {
  await delay(200);
  const plan = mockPlans.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  const idx = plan.flow_steps.findIndex(s => s.id === flowStepId);
  if (idx > -1) {
    plan.flow_steps.splice(idx, 1);
    plan.flow_steps.forEach((s, i) => { s.step_order = i + 1; });
  }
}

export async function moveFlowStep(planId: number, flowStepId: number, direction: 'up' | 'down') {
  await delay(200);
  const plan = mockPlans.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  const idx = plan.flow_steps.findIndex(s => s.id === flowStepId);
  if (idx === -1) throw new Error('Step not found');
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= plan.flow_steps.length) return;
  [plan.flow_steps[idx], plan.flow_steps[swapIdx]] = [plan.flow_steps[swapIdx], plan.flow_steps[idx]];
  plan.flow_steps.forEach((s, i) => { s.step_order = i + 1; });
}

// Operations live inside flow steps
function findOperation(opId: number): { step: FlowStep; op: Operation } | null {
  for (const plan of mockPlans) {
    for (const step of plan.flow_steps) {
      const op = step.operations.find(o => o.id === opId);
      if (op) return { step, op };
    }
  }
  return null;
}

export async function addFlowStepOperation(flowStepId: number, name: string) {
  await delay(300);
  let foundStep: FlowStep | null = null;
  for (const plan of mockPlans) {
    const step = plan.flow_steps.find(s => s.id === flowStepId);
    if (step) { foundStep = step; break; }
  }
  if (!foundStep) throw new Error('Flow step not found');
  opIdCounter++;
  const op: Operation = {
    id: opIdCounter,
    inspection_plan_id: 0,
    operation_order: foundStep.operations.length + 1,
    operation_name: name,
    dimensions: [],
  };
  foundStep.operations.push(op);
  return op;
}

export async function removeFlowStepOperation(flowStepId: number, operationId: number) {
  await delay(200);
  for (const plan of mockPlans) {
    const step = plan.flow_steps.find(s => s.id === flowStepId);
    if (step) {
      const idx = step.operations.findIndex(o => o.id === operationId);
      if (idx > -1) { step.operations.splice(idx, 1); return; }
    }
  }
}

export async function addDimension(
  operationId: number,
  data: { dimension_name: string; nominal: number; min_limit: number; max_limit: number; unit: string; gauge_id: number | null; station_id: number | null },
) {
  await delay(300);
  dimIdCounter++;
  const dim: Dimension = { id: dimIdCounter, operation_id: operationId, ...data };
  const found = findOperation(operationId);
  if (found) { found.op.dimensions.push(dim); }
  return dim;
}

export async function updateDimension(operationId: number, dimensionId: number, data: Partial<Dimension>) {
  await delay(200);
  const found = findOperation(operationId);
  if (found) {
    const dim = found.op.dimensions.find(d => d.id === dimensionId);
    if (dim) { Object.assign(dim, data); return dim; }
  }
  throw new Error('Dimension not found');
}

export async function removeDimension(operationId: number, dimensionId: number) {
  await delay(200);
  const found = findOperation(operationId);
  if (found) {
    const idx = found.op.dimensions.findIndex(d => d.id === dimensionId);
    if (idx > -1) { found.op.dimensions.splice(idx, 1); return; }
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

// ============ Production Records ============
const allProductionRecords = [
  { id: 1, serial: 'SB2507140001', part: 'BUSH-001', component: 'Precision Bushing', machine: 'INS-01', operator: 'Rajesh Kumar', status: 'accepted', qr_status: 'marked', started: '2026-07-14 06:02', completed: '2026-07-14 06:08' },
  { id: 2, serial: 'SB2507140002', part: 'PISTON-001', component: 'Hydraulic Piston', machine: 'INS-01', operator: 'Rajesh Kumar', status: 'rejected', qr_status: 'n/a', started: '2026-07-14 06:15', completed: '2026-07-14 06:17', reason: 'Outer Diameter Out of Tolerance' },
  { id: 3, serial: 'SB2507140003', part: 'BUSH-001', component: 'Precision Bushing', machine: 'INS-02', operator: 'Suresh Patel', status: 'accepted', qr_status: 'marked', started: '2026-07-14 07:30', completed: '2026-07-14 07:36' },
  { id: 4, serial: 'SB2507140004', part: 'BEARING-001', component: 'Ball Bearing', machine: 'INS-01', operator: 'Suresh Patel', status: 'accepted', qr_status: 'pending', started: '2026-07-14 08:00', completed: '2026-07-14 08:05' },
  { id: 5, serial: 'SB2507140005', part: 'SHAFT-001', component: 'Drive Shaft', machine: 'INS-02', operator: 'Rajesh Kumar', status: 'accepted', qr_status: 'marked', started: '2026-07-14 08:45', completed: '2026-07-14 08:50' },
  { id: 6, serial: 'SB2507140006', part: 'BUSH-001', component: 'Precision Bushing', machine: 'INS-01', operator: 'Suresh Patel', status: 'rejected', qr_status: 'n/a', started: '2026-07-14 09:10', completed: '2026-07-14 09:12', reason: 'Inner Diameter Out of Tolerance' },
  { id: 7, serial: 'SB2507140007', part: 'SLEEVE-001', component: 'Steel Sleeve', machine: 'INS-02', operator: 'Rajesh Kumar', status: 'in_progress', qr_status: 'n/a', started: '2026-07-14 09:45', completed: null },
  { id: 8, serial: 'SB2507140008', part: 'PISTON-001', component: 'Hydraulic Piston', machine: 'INS-01', operator: 'Suresh Patel', status: 'accepted', qr_status: 'marked', started: '2026-07-14 10:00', completed: '2026-07-14 10:07' },
  { id: 9, serial: 'SB2507140009', part: 'BEARING-001', component: 'Ball Bearing', machine: 'INS-02', operator: 'Rajesh Kumar', status: 'accepted', qr_status: 'pending', started: '2026-07-14 10:30', completed: '2026-07-14 10:34' },
  { id: 10, serial: 'SB2507140010', part: 'SHAFT-001', component: 'Drive Shaft', machine: 'INS-01', operator: 'Suresh Patel', status: 'rejected', qr_status: 'n/a', started: '2026-07-14 11:00', completed: '2026-07-14 11:03', reason: 'Surface Roughness Exceeded' },
];

export async function getProductionRecords(filters?: { status?: string; machine?: string; search?: string }) {
  await delay(400);
  let result = [...allProductionRecords];
  if (filters?.status && filters.status !== 'all') result = result.filter(r => r.status === filters.status);
  if (filters?.machine && filters.machine !== 'all') result = result.filter(r => r.machine === filters.machine);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(r => r.serial.toLowerCase().includes(q) || r.part.toLowerCase().includes(q));
  }
  return result;
}

// ============ Traceability ============
const traceabilityData: Record<string, { event: string; timestamp: string; details: string }[]> = {
  'SB2507140001': [
    { event: 'Production Started', timestamp: '2026-07-14 06:02:15', details: 'Component: BUSH-001, Machine: INS-01, Operator: Rajesh Kumar' },
    { event: 'Rough Turning', timestamp: '2026-07-14 06:03:20', details: 'Outer Diameter: 20.001mm (PASS)' },
    { event: 'Finish Grinding', timestamp: '2026-07-14 06:05:40', details: 'Inner Diameter: 10.002mm (PASS)' },
    { event: 'Final Inspection', timestamp: '2026-07-14 06:07:55', details: 'Length: 30.003mm (PASS)' },
    { event: 'Component Accepted', timestamp: '2026-07-14 06:08:42', details: 'All inspections passed' },
    { event: 'QR Code Generated', timestamp: '2026-07-14 06:09:00', details: 'QR data: AutoParts Ltd / BUSH-001 / SB2507140001' },
    { event: 'QR Marked', timestamp: '2026-07-14 06:09:30', details: 'QR marking completed successfully' },
    { event: 'Completed', timestamp: '2026-07-14 06:09:35', details: 'Component ready for dispatch' },
  ],
  'SB2507140002': [
    { event: 'Production Started', timestamp: '2026-07-14 06:15:30', details: 'Component: PISTON-001, Machine: INS-01, Operator: Rajesh Kumar' },
    { event: 'Outer Diameter Turning', timestamp: '2026-07-14 06:16:20', details: 'Outer Diameter: 50.015mm (FAIL — exceeds max 50.010)' },
    { event: 'Component Rejected', timestamp: '2026-07-14 06:17:05', details: 'Reason: Outer Diameter Out of Tolerance' },
  ],
};

export async function getTraceability(serial: string) {
  await delay(400);
  return traceabilityData[serial] || null;
}

// ============ Audit Logs ============
const auditLogs = [
  { id: 1, user: 'admin', action: 'Login', entity: 'User', details: 'Admin logged in', date: '2026-07-14 06:00:00' },
  { id: 2, user: 'admin', action: 'Update', entity: 'Component', details: 'Changed BUSH-001 revision from 1 to 2', date: '2026-07-14 06:05:00' },
  { id: 3, user: 'admin', action: 'Create', entity: 'User', details: 'Created user operator3', date: '2026-07-14 07:00:00' },
  { id: 4, user: 'operator1', action: 'Login', entity: 'User', details: 'Operator logged in', date: '2026-07-14 07:15:00' },
  { id: 5, user: 'operator1', action: 'Start Process', entity: 'Production', details: 'Started SB2507140003', date: '2026-07-14 07:30:00' },
  { id: 6, user: 'admin', action: 'Update', entity: 'Tolerance', details: 'Modified Outer Diameter tolerance for BUSH-001', date: '2026-07-14 08:00:00' },
  { id: 7, user: 'supervisor', action: 'Login', entity: 'User', details: 'Supervisor logged in', date: '2026-07-14 08:30:00' },
  { id: 8, user: 'admin', action: 'Create', entity: 'Component', details: 'Created new component SHAFT-002', date: '2026-07-14 09:00:00' },
  { id: 9, user: 'admin', action: 'Delete', entity: 'User', details: 'Deleted user engineer1', date: '2026-07-14 09:30:00' },
  { id: 10, user: 'operator2', action: 'Login', entity: 'User', details: 'Operator logged in', date: '2026-07-14 10:00:00' },
];

export async function getAuditLogs() {
  await delay(300);
  return [...auditLogs];
}

// ============ Reports ============
export async function getReportsData(type: string) {
  await delay(400);
  const reports: Record<string, unknown> = {
    daily: { produced: 47, accepted: 42, rejected: 5, quality: '89.4%', target: 80, efficiency: '58.8%' },
    weekly: { produced: 312, accepted: 286, rejected: 26, quality: '91.7%', target: 400, efficiency: '78.0%' },
    monthly: { produced: 1245, accepted: 1148, rejected: 97, quality: '92.2%', target: 1600, efficiency: '77.8%' },
    machine: [
      { name: 'INS-01', produced: 22, accepted: 19, rejected: 3, quality: '86.4%' },
      { name: 'INS-02', produced: 25, accepted: 23, rejected: 2, quality: '92.0%' },
    ],
    operator: [
      { name: 'Rajesh Kumar', produced: 25, accepted: 22, rejected: 3, quality: '88.0%' },
      { name: 'Suresh Patel', produced: 22, accepted: 20, rejected: 2, quality: '90.9%' },
    ],
  };
  return reports[type] || null;
}

// ============ Settings ============
let settings = {
  company: { name: 'AutoParts Ltd', address: 'Plot 42, Industrial Area', city: 'Pune', country: 'India', phone: '+91-20-12345678' },
  backup: { auto_backup: true, backup_time: '02:00', retention_days: 30 },
  serial_format: { prefix: 'SB', include_date: true, digits: 4 },
  qr: { format: 'QR_CODE', content: 'COMPANY\\nPART_CODE\\nSERIAL_NO', size: '20x20mm' },
  shift: { morning: '06:00-14:00', afternoon: '14:00-22:00', night: '22:00-06:00' },
};

export async function getSettings() {
  await delay(300);
  return { ...settings };
}

export async function saveSettings(data: Partial<typeof settings>) {
  await delay(400);
  Object.assign(settings, data);
  return { ...settings };
}

// ============ Supervisor Dashboard ============
export async function getSupervisorDashboard() {
  await delay(400);
  return {
    todayProduction: 47,
    target: 80,
    accepted: 42,
    rejected: 5,
    qualityPercentage: 89.4,
    efficiency: 58.8,
    machineStatuses: [
      { id: 1, name: 'Inspection Station 1', type: 'inspection', status: 'running', operator: 'Rajesh Kumar', currentSerial: 'SB2507140010' },
      { id: 2, name: 'Inspection Station 2', type: 'inspection', status: 'idle', operator: '-', currentSerial: null },
      { id: 3, name: 'QR Marking Station', type: 'qr_marking', status: 'running', operator: 'System', currentSerial: 'SB2507140008' },
      { id: 4, name: 'CNC Lathe 01', type: 'production', status: 'running', operator: '-', currentSerial: null },
    ],
    machineWise: [
      { machine: 'INS-01', produced: 22, accepted: 19, rejected: 3 },
      { machine: 'INS-02', produced: 25, accepted: 23, rejected: 2 },
    ],
    operatorWise: [
      { operator: 'Rajesh Kumar', produced: 25, accepted: 22, rejected: 3 },
      { operator: 'Suresh Patel', produced: 22, accepted: 20, rejected: 2 },
    ],
    hourlyTrend: [3, 5, 7, 6, 8, 4, 5, 6],
    rejectionReasons: [
      { reason: 'Outer Diameter Out of Tolerance', count: 2 },
      { reason: 'Inner Diameter Out of Tolerance', count: 1 },
      { reason: 'Surface Roughness Exceeded', count: 1 },
      { reason: 'Length Out of Tolerance', count: 1 },
    ],
  };
}

// ============ Rejected Components ============
export async function getRejectedComponents() {
  await delay(300);
  return allProductionRecords.filter(r => r.status === 'rejected');
}

// ============ Supervisor Search ============
export async function supervisorSearch(query: string) {
  await delay(400);
  const q = query.toLowerCase();
  return allProductionRecords.filter(r =>
    r.serial.toLowerCase().includes(q) || r.part.toLowerCase().includes(q)
  ).map(r => ({
    ...r,
    measurements: [
      { dim: 'Outer Diameter', nominal: '20.000', measured: '20.001', min: '19.995', max: '20.005', result: 'PASS' as const },
      { dim: 'Inner Diameter', nominal: '10.000', measured: '10.002', min: '9.995', max: '10.005', result: 'PASS' as const },
    ],
  }));
}
