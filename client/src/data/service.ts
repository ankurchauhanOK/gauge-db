import type {
  ProductionRecord,
  InspectionPlan,
  InspectionResult,
  Component,
  Machine,
  Gauge,
  User,
  UserRole,
  Dimension,
  FlowStep,
  Operation,
  ComponentDetail,
  Measurement,
  ManufacturingStep,
  ComponentRevision,
} from '../../../shared/types';
import {
  mockComponents,
  mockPlans,
  mockMachines,
  mockGauges,
  mockUsers,
  mockComponentDetails,
  operatorDashboardMock,
  adminDashboardMock,
  getCurrentShift,
  createMockRecord,
  createMockResult,
  searchHistoryMock,
  generateSerial,
} from './mock';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let inspectionCounter = 0;
let inspectionRecords: {
  id: number;
  component_id: number;
  part_code: string;
  serial_number: string;
  machine_id: number;
  operator_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejection_reason: string | null;
  parameters: FlatParameter[];
  measurements: FlatMeasurement[];
  started_at: string;
  completed_at: string | null;
}[] = [];

export interface FlatParameter {
  id: number;
  name: string;
  nominal: number;
  min_limit: number;
  max_limit: number;
  unit: string;
  sort_order: number;
}

export interface FlatMeasurement {
  parameter_id: number;
  parameter_name: string;
  measured_value: number;
  nominal: number;
  min_limit: number;
  max_limit: number;
  unit: string;
  result: 'PASS' | 'FAIL';
  measured_at: string;
}

export interface InspectionRecord {
  id: number;
  component_id: number;
  part_code: string;
  serial_number: string;
  machine_id: number;
  operator_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejection_reason: string | null;
  parameters: FlatParameter[];
  measurements: FlatMeasurement[];
  started_at: string;
  completed_at: string | null;
}

// ============ Flatten dimensions from plan into a flat parameter list ============
function flattenParameters(plan: InspectionPlan): FlatParameter[] {
  let order = 0;
  const params: FlatParameter[] = [];
  const seen = new Set<number>();
  for (const step of plan.flow_steps) {
    for (const op of step.operations) {
      for (const dim of op.dimensions) {
        if (!seen.has(dim.id)) {
          seen.add(dim.id);
          order++;
          params.push({
            id: dim.id,
            name: dim.dimension_name,
            nominal: dim.nominal,
            min_limit: dim.min_limit,
            max_limit: dim.max_limit,
            unit: dim.unit,
            sort_order: order,
          });
        }
      }
    }
  }
  return params;
}

// ============ Component Detail (replaces InspectionPlan) ============
export async function getComponentDetail(componentId: number): Promise<ComponentDetail | null> {
  await delay(200);
  return mockComponentDetails[componentId] || null;
}

export function getFlatParameters(componentId: number): FlatParameter[] {
  const detail = mockComponentDetails[componentId];
  if (!detail) return [];
  let order = 0;
  return detail.measurements.map(m => ({
    id: m.id,
    name: m.name,
    nominal: m.nominal,
    min_limit: m.min_limit,
    max_limit: m.max_limit,
    unit: m.unit,
    sort_order: ++order,
  }));
}

export async function saveComponentMeasurements(componentId: number, measurements: Measurement[]): Promise<Measurement[]> {
  await delay(300);
  if (mockComponentDetails[componentId]) {
    mockComponentDetails[componentId].measurements = measurements;
  }
  return measurements;
}

export async function saveComponentFlow(componentId: number, steps: ManufacturingStep[]): Promise<ManufacturingStep[]> {
  await delay(300);
  if (mockComponentDetails[componentId]) {
    mockComponentDetails[componentId].flow_steps = steps;
  }
  return steps;
}

export async function createComponentRevision(componentId: number, description: string): Promise<ComponentRevision> {
  await delay(300);
  const detail = mockComponentDetails[componentId];
  if (!detail) throw new Error('Component not found');
  const prev = detail.revisions[detail.revisions.length - 1];
  const rev: ComponentRevision = {
    revision: (prev?.revision || 0) + 1,
    description,
    created_at: new Date().toISOString(),
    created_by: 'System Administrator',
  };
  detail.revisions.push(rev);
  detail.component.revision = rev.revision;
  return rev;
}

export function getGaugeAssignments(): { gaugeId: number; componentPartCodes: string[] }[] {
  const map = new Map<number, Set<string>>();
  for (const cid in mockComponentDetails) {
    const detail = mockComponentDetails[cid];
    for (const m of detail.measurements) {
      if (m.gauge_id != null) {
        if (!map.has(m.gauge_id)) map.set(m.gauge_id, new Set());
        map.get(m.gauge_id)!.add(detail.component.part_code);
      }
    }
  }
  return Array.from(map.entries()).map(([gaugeId, parts]) => ({
    gaugeId,
    componentPartCodes: Array.from(parts),
  }));
}

// ============ Start a new inspection ============
export async function startInspection(
  componentId: number,
  machineId: number,
  operatorName: string,
): Promise<InspectionRecord> {
  await delay(600);
  inspectionCounter++;
  const comp = mockComponents.find(c => c.id === componentId)!;
  const serial = generateSerial();
  const detail = mockComponentDetails[componentId];
  const parameters = detail ? detail.measurements.map((m, i) => ({
    id: m.id,
    name: m.name,
    nominal: m.nominal,
    min_limit: m.min_limit,
    max_limit: m.max_limit,
    unit: m.unit,
    sort_order: i + 1,
  })) : [];

  const record: InspectionRecord = {
    id: Date.now() + inspectionCounter,
    component_id: componentId,
    part_code: comp.part_code,
    serial_number: serial,
    machine_id: machineId,
    operator_name: operatorName,
    status: 'pending',
    rejection_reason: null,
    parameters,
    measurements: [],
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  inspectionRecords.push(record);
  return record;
}

// ============ Record a measurement for an active inspection ============
export async function recordMeasurement(
  recordId: number,
  param: FlatParameter,
  measuredValue: number,
): Promise<{ measurement: FlatMeasurement; record: InspectionRecord; isComplete: boolean }> {
  await delay(200);
  const record = inspectionRecords.find(r => r.id === recordId);
  if (!record) throw new Error('Inspection record not found');

  const passed = measuredValue >= param.min_limit && measuredValue <= param.max_limit;

  const measurement: FlatMeasurement = {
    parameter_id: param.id,
    parameter_name: param.name,
    measured_value: measuredValue,
    nominal: param.nominal,
    min_limit: param.min_limit,
    max_limit: param.max_limit,
    unit: param.unit,
    result: passed ? 'PASS' : 'FAIL',
    measured_at: new Date().toISOString(),
  };

  record.measurements.push(measurement);

  if (!passed) {
    record.status = 'rejected';
    record.rejection_reason = `${param.name} out of tolerance`;
    record.completed_at = new Date().toISOString();
    return { measurement, record, isComplete: true };
  }

  const allParamIds = param.sort_order;
  const measuredCount = record.measurements.length;
  const totalCount = record.parameters.length;

  if (measuredCount >= totalCount) {
    record.status = 'accepted';
    record.completed_at = new Date().toISOString();
    return { measurement, record, isComplete: true };
  }

  return { measurement, record, isComplete: false };
}

// ============ Get pending inspections ============
export async function getPendingInspections(): Promise<InspectionRecord[]> {
  await delay(200);
  return inspectionRecords.filter(r => r.status === 'pending');
}

// ============ Get inspection record by serial ============
export async function getInspectionBySerial(serial: string): Promise<InspectionRecord | null> {
  await delay(200);
  return inspectionRecords.find(r => r.serial_number === serial) || null;
}

// ============ Get all completed inspection records ============
export async function getAllInspectionRecords(): Promise<InspectionRecord[]> {
  await delay(200);
  return [...inspectionRecords];
}

// ============ Reset (for testing) ============
export function resetInspections() {
  inspectionRecords = [];
  inspectionCounter = 0;
}

// ============ Existing functions kept as-is ============

export function resetInspection() {}

export async function getDashboard() {
  await delay(400);
  const pending = inspectionRecords.filter(r => r.status === 'pending').length;
  const rejected = inspectionRecords.filter(r => r.status === 'rejected').length;
  const allOps = inspectionRecords.length;
  const recentProduction = allProductionRecords.slice(0, 6).map(r => ({
    serial: r.serial,
    part: r.part,
    status: r.status,
    time: r.started.split(' ')[1] || r.started,
    operator: r.operator,
  }));
  const alerts: { type: string; message: string; time: string }[] = [];
  const idleMachines = operatorDashboardMock.machineStatus.filter(m => m.status !== 'running');
  idleMachines.forEach(m => {
    alerts.push({ type: 'info', message: `${m.name} is ${m.status}`, time: 'now' });
  });
  return {
    todayProduction: operatorDashboardMock.todayProduction + allOps,
    accepted: operatorDashboardMock.accepted + inspectionRecords.filter(r => r.status === 'accepted').length,
    rejected: operatorDashboardMock.rejected + rejected,
    target: operatorDashboardMock.target,
    qualityPercentage: operatorDashboardMock.qualityPercentage,
    machineStatus: operatorDashboardMock.machineStatus,
    shift: getCurrentShift(),
    pending,
    recentProduction,
    alerts,
  };
}

export async function startProcess(componentId: number, machineId: number, operatorName: string) {
  await delay(800);
  const insp = await startInspection(componentId, machineId, operatorName);
  return {
    record: {
      id: insp.id,
      serial_number: insp.serial_number,
      component_id: insp.component_id,
      part_code: insp.part_code,
      machine_id: insp.machine_id,
      operator_id: 1,
      status: 'in_progress',
      current_operation: 1,
      rejection_reason: null,
      started_at: insp.started_at,
      completed_at: null,
    } as ProductionRecord,
    component: mockComponents.find(c => c.id === componentId)!,
    machine: mockMachines.find(m => m.id === machineId)!,
    plan: mockPlans.find(p => p.component_id === componentId),
    currentOperation: null,
  };
}

export async function getInspectionData(serial: string) {
  await delay(300);
  const record = inspectionRecords.find(r => r.serial_number === serial);
  if (!record) throw new Error('No active inspection');
  return {
    record: {
      id: record.id,
      serial_number: record.serial_number,
      component_id: record.component_id,
      part_code: record.part_code,
      machine_id: record.machine_id,
      operator_id: 1,
      status: record.status === 'pending' ? 'in_progress' : record.status,
      current_operation: 1,
      rejection_reason: record.rejection_reason,
      started_at: record.started_at,
      completed_at: record.completed_at,
    } as ProductionRecord,
    component: mockComponents.find(c => c.id === record.component_id)!,
    machine: mockMachines.find(m => m.id === record.machine_id)!,
    currentOperation: null,
    operationIndex: 0,
    totalOperations: record.parameters.length,
    completedResults: record.measurements.map((m, i) => ({
      id: i + 1,
      production_record_id: record.id,
      dimension_id: m.parameter_id,
      operation_id: 1,
      measured_value: m.measured_value,
      nominal: m.nominal,
      min_limit: m.min_limit,
      max_limit: m.max_limit,
      result: m.result,
      gauge_id: null,
      measured_at: m.measured_at,
    })) as InspectionResult[],
    status: record.status,
  };
}

export async function submitMeasurement(
  dimension: Dimension,
  measuredValue: number,
) {
  await delay(400);
  const passed = measuredValue >= dimension.min_limit && measuredValue <= dimension.max_limit;
  return {
    result: {
      id: Date.now(),
      production_record_id: 0,
      dimension_id: dimension.id,
      operation_id: 1,
      measured_value: measuredValue,
      nominal: dimension.nominal,
      min_limit: dimension.min_limit,
      max_limit: dimension.max_limit,
      result: passed ? 'PASS' : 'FAIL',
      gauge_id: null,
      measured_at: new Date().toISOString(),
    } as InspectionResult,
    nextOperation: null,
    isComplete: true,
    finalStatus: passed ? 'accepted' : 'rejected',
  };
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

export async function deleteGauge(id: number) {
  await delay(200);
  const idx = mockGauges.findIndex(g => g.id === id);
  if (idx > -1) mockGauges.splice(idx, 1);
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
  qr: { format: 'QR_CODE', content: 'COMPANY\nPART_CODE\nSERIAL_NO', size: '20x20mm' },
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
