import type {
  Component,
  InspectionPlan,
  Operation,
  Dimension,
  Machine,
  ProductionRecord,
  InspectionResult,
  User,
  Gauge,
  ComponentDetail,
  Measurement,
  ManufacturingStep,
  ComponentDocument,
  ComponentRevision,
} from '../../../shared/types';

const now = new Date();

export const mockUsers: (User & { password?: string })[] = [
  { id: 1, username: 'admin', name: 'System Administrator', role: 'admin', is_active: true, password: 'admin123' },
  { id: 2, username: 'operator1', name: 'Rajesh Kumar', role: 'operator', is_active: true, password: 'operator123' },
  { id: 3, username: 'operator2', name: 'Suresh Patel', role: 'operator', is_active: true, password: 'operator123' },
  { id: 4, username: 'supervisor', name: 'Amit Singh', role: 'supervisor', is_active: true, password: 'supervisor123' },
  { id: 5, username: 'quality1', name: 'Priya Sharma', role: 'quality', is_active: true, password: 'supervisor123' },
  { id: 6, username: 'engineer1', name: 'Vikram Reddy', role: 'admin', is_active: false },
];

export const mockComponents: Component[] = [
  { id: 1, part_code: 'BUSH-001', description: 'Precision Bushing 20mm ID', customer: 'AutoParts Ltd', revision: 2, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 2, part_code: 'PISTON-001', description: 'Hydraulic Piston 50mm', customer: 'MechWorks Inc', revision: 1, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 3, part_code: 'BEARING-001', description: 'Ball Bearing 30mm ID', customer: 'DriveTrain Co', revision: 3, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 4, part_code: 'SHAFT-001', description: 'Drive Shaft 25mm', customer: 'AutoParts Ltd', revision: 1, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 5, part_code: 'SLEEVE-001', description: 'Steel Sleeve 40mm', customer: 'MechWorks Inc', revision: 2, status: 'inactive', created_at: now.toISOString(), updated_at: now.toISOString() },
];

export const mockGauges: Gauge[] = [
  { id: 1, gauge_name: 'Air Gauge 01', interface_type: 'serial', connection_config: { port: 'COM3', baudRate: 9600 }, calibration_date: '2026-01-15', calibration_due: '2026-07-15', is_active: true },
  { id: 2, gauge_name: 'Air Gauge 02', interface_type: 'serial', connection_config: { port: 'COM4', baudRate: 9600 }, calibration_date: '2026-02-20', calibration_due: '2026-08-20', is_active: true },
  { id: 3, gauge_name: 'Digital Micrometer', interface_type: 'web_serial', connection_config: { baudRate: 115200 }, calibration_date: '2026-03-10', calibration_due: '2026-09-10', is_active: true },
  { id: 4, gauge_name: 'Laser Scanner', interface_type: 'tcp', connection_config: { host: '192.168.1.50', portNumber: 5000 }, calibration_date: '2025-12-01', calibration_due: '2026-06-01', is_active: false },
];

export const mockMachines: Machine[] = [
  { id: 1, machine_code: 'INS-01', name: 'Inspection Station 1', ip_address: '192.168.1.101', machine_type: 'inspection', status: 'idle' },
  { id: 2, machine_code: 'INS-02', name: 'Inspection Station 2', ip_address: '192.168.1.102', machine_type: 'inspection', status: 'running' },
  { id: 3, machine_code: 'QR-01', name: 'QR Marking Station', ip_address: '192.168.1.201', machine_type: 'qr_marking', status: 'idle' },
  { id: 4, machine_code: 'PROD-01', name: 'CNC Lathe 01', ip_address: '192.168.1.10', machine_type: 'production', status: 'running' },
];

// ============ Component-Centric Detail Data ============
const bushingMeasurements: Measurement[] = [
  { id: 1, component_id: 1, name: 'Outer Diameter', nominal: 20.000, min_limit: 19.995, max_limit: 20.005, unit: 'mm', gauge_id: 1, sort_order: 1 },
  { id: 2, component_id: 1, name: 'Length', nominal: 30.000, min_limit: 29.990, max_limit: 30.010, unit: 'mm', gauge_id: 1, sort_order: 2 },
  { id: 3, component_id: 1, name: 'Inner Diameter', nominal: 10.000, min_limit: 9.995, max_limit: 10.005, unit: 'mm', gauge_id: 1, sort_order: 3 },
  { id: 4, component_id: 1, name: 'Outer Diameter (Final)', nominal: 20.000, min_limit: 19.995, max_limit: 20.005, unit: 'mm', gauge_id: 1, sort_order: 4 },
  { id: 5, component_id: 1, name: 'Surface Roughness', nominal: 0.800, min_limit: 0.000, max_limit: 1.600, unit: 'μm', gauge_id: 2, sort_order: 5 },
];

const pistonMeasurements: Measurement[] = [
  { id: 6, component_id: 2, name: 'Outer Diameter', nominal: 50.000, min_limit: 49.990, max_limit: 50.010, unit: 'mm', gauge_id: 1, sort_order: 1 },
  { id: 7, component_id: 2, name: 'Surface Roughness', nominal: 0.800, min_limit: 0.000, max_limit: 1.600, unit: 'μm', gauge_id: 2, sort_order: 2 },
];

const bushingSteps: ManufacturingStep[] = [
  {
    id: 1, component_id: 1, machine_id: 4, step_order: 1,
    operations: [
      { id: 1, name: 'Rough Turning', order: 1, measurement_ids: [1] },
      { id: 2, name: 'Facing', order: 2, measurement_ids: [2] },
    ],
  },
  {
    id: 2, component_id: 1, machine_id: 1, step_order: 2,
    operations: [
      { id: 3, name: 'Dimensional Check', order: 3, measurement_ids: [3, 4] },
      { id: 4, name: 'Surface Inspection', order: 4, measurement_ids: [5] },
    ],
  },
  {
    id: 3, component_id: 1, machine_id: 3, step_order: 3,
    operations: [
      { id: 5, name: 'QR Marking', order: 5, measurement_ids: [] },
    ],
  },
];

const pistonSteps: ManufacturingStep[] = [
  {
    id: 4, component_id: 2, machine_id: 4, step_order: 1,
    operations: [
      { id: 6, name: 'Outer Diameter Turning', order: 1, measurement_ids: [6] },
    ],
  },
  {
    id: 5, component_id: 2, machine_id: 2, step_order: 2,
    operations: [
      { id: 7, name: 'Surface Inspection', order: 2, measurement_ids: [7] },
    ],
  },
];

const bushingDocs: ComponentDocument[] = [
  { id: 1, component_id: 1, name: 'BUSH-001 Drawing.pdf', type: 'drawing', file_url: null, uploaded_at: '2026-01-10T10:00:00Z' },
  { id: 2, component_id: 1, name: 'Bushing SOP.docx', type: 'sop', file_url: null, uploaded_at: '2026-01-12T14:30:00Z' },
  { id: 3, component_id: 1, name: 'Control Plan Rev 2.pdf', type: 'control_plan', file_url: null, uploaded_at: '2026-02-01T09:00:00Z' },
];

const bushingRevisions: ComponentRevision[] = [
  { revision: 1, description: 'Initial release', created_at: '2025-06-01T08:00:00Z', created_by: 'System Administrator' },
  { revision: 2, description: 'Updated outer diameter tolerance from ±0.010 to ±0.005', created_at: '2026-01-15T11:00:00Z', created_by: 'System Administrator' },
];

const pistonDocs: ComponentDocument[] = [
  { id: 4, component_id: 2, name: 'PISTON-001 CAD.stp', type: 'cad', file_url: null, uploaded_at: '2026-03-01T10:00:00Z' },
];

const pistonRevisions: ComponentRevision[] = [
  { revision: 1, description: 'Initial release', created_at: '2026-03-01T08:00:00Z', created_by: 'System Administrator' },
];

export const mockComponentDetails: Record<number, ComponentDetail> = {
  1: {
    component: mockComponents[0],
    measurements: bushingMeasurements,
    flow_steps: bushingSteps,
    documents: bushingDocs,
    revisions: bushingRevisions,
  },
  2: {
    component: mockComponents[1],
    measurements: pistonMeasurements,
    flow_steps: pistonSteps,
    documents: pistonDocs,
    revisions: pistonRevisions,
  },
  3: {
    component: mockComponents[2],
    measurements: [],
    flow_steps: [],
    documents: [],
    revisions: [],
  },
  4: {
    component: mockComponents[3],
    measurements: [],
    flow_steps: [],
    documents: [],
    revisions: [],
  },
  5: {
    component: mockComponents[4],
    measurements: [],
    flow_steps: [],
    documents: [],
    revisions: [],
  },
};

// ============ Old Plan Data (kept for migration - will remove later) ============
export const mockPlans: InspectionPlan[] = [
  {
    id: 1, name: 'Bushing Precision Line', component_id: 1, revision: 2, is_active: true, created_at: now.toISOString(),
    operations: [],
    flow_steps: [
      {
        id: 1, inspection_plan_id: 1, machine_id: 4, step_order: 1,
        operations: [
          { id: 1, inspection_plan_id: 1, operation_order: 1, operation_name: 'Rough Turning', dimensions: [
            { id: 1, operation_id: 1, dimension_name: 'Outer Diameter', nominal: 20.000, min_limit: 19.995, max_limit: 20.005, unit: 'mm', gauge_id: 1, station_id: 1 },
          ]},
          { id: 2, inspection_plan_id: 1, operation_order: 2, operation_name: 'Facing', dimensions: [
            { id: 2, operation_id: 2, dimension_name: 'Length', nominal: 30.000, min_limit: 29.990, max_limit: 30.010, unit: 'mm', gauge_id: 1, station_id: 1 },
          ]},
        ],
      },
      {
        id: 2, inspection_plan_id: 1, machine_id: 1, step_order: 2,
        operations: [
          { id: 3, inspection_plan_id: 1, operation_order: 3, operation_name: 'Dimensional Check', dimensions: [
            { id: 3, operation_id: 3, dimension_name: 'Inner Diameter', nominal: 10.000, min_limit: 9.995, max_limit: 10.005, unit: 'mm', gauge_id: 1, station_id: 1 },
            { id: 4, operation_id: 3, dimension_name: 'Outer Diameter', nominal: 20.000, min_limit: 19.995, max_limit: 20.005, unit: 'mm', gauge_id: 1, station_id: 1 },
          ]},
          { id: 4, inspection_plan_id: 1, operation_order: 4, operation_name: 'Surface Inspection', dimensions: [
            { id: 5, operation_id: 4, dimension_name: 'Surface Roughness', nominal: 0.800, min_limit: 0.000, max_limit: 1.600, unit: 'μm', gauge_id: 2, station_id: 1 },
          ]},
        ],
      },
      {
        id: 3, inspection_plan_id: 1, machine_id: 3, step_order: 3,
        operations: [
          { id: 5, inspection_plan_id: 1, operation_order: 5, operation_name: 'QR Marking', dimensions: [] },
        ],
      },
    ],
  },
  {
    id: 2, name: 'Piston Assembly Flow', component_id: 2, revision: 1, is_active: true, created_at: now.toISOString(),
    operations: [],
    flow_steps: [
      {
        id: 4, inspection_plan_id: 2, machine_id: 4, step_order: 1,
        operations: [
          { id: 6, inspection_plan_id: 2, operation_order: 1, operation_name: 'Outer Diameter Turning', dimensions: [
            { id: 6, operation_id: 6, dimension_name: 'Outer Diameter', nominal: 50.000, min_limit: 49.990, max_limit: 50.010, unit: 'mm', gauge_id: 1, station_id: 2 },
          ]},
        ],
      },
      {
        id: 5, inspection_plan_id: 2, machine_id: 2, step_order: 2,
        operations: [
          { id: 7, inspection_plan_id: 2, operation_order: 2, operation_name: 'Surface Inspection', dimensions: [
            { id: 7, operation_id: 7, dimension_name: 'Surface Roughness', nominal: 0.800, min_limit: 0.000, max_limit: 1.600, unit: 'μm', gauge_id: 2, station_id: 2 },
          ]},
        ],
      },
    ],
  },
];

let serialCounter = 0;

export function generateSerial(): string {
  serialCounter++;
  const date = new Date();
  const ds = date.toISOString().slice(2, 10).replace(/-/g, '');
  return `SB${ds}${String(serialCounter).padStart(4, '0')}`;
}

let recordIdCounter = 10;

export function createMockRecord(componentId: number, machineId: number, operatorName: string): ProductionRecord {
  recordIdCounter++;
  const comp = mockComponents.find(c => c.id === componentId)!;
  return {
    id: recordIdCounter,
    serial_number: generateSerial(),
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
}

let resultIdCounter = 100;

export function createMockResult(
  recordId: number,
  dimension: Dimension,
  operationId: number,
  measuredValue: number,
  status: 'PASS' | 'FAIL',
): InspectionResult {
  resultIdCounter++;
  return {
    id: resultIdCounter,
    production_record_id: recordId,
    dimension_id: dimension.id,
    operation_id: operationId,
    measured_value: measuredValue,
    nominal: dimension.nominal,
    min_limit: dimension.min_limit,
    max_limit: dimension.max_limit,
    result: status,
    gauge_id: dimension.gauge_id,
    measured_at: new Date().toISOString(),
  };
}

const shifts = ['Morning (06:00 - 14:00)', 'Afternoon (14:00 - 22:00)', 'Night (22:00 - 06:00)'];

export function getCurrentShift(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return shifts[0];
  if (hour >= 14 && hour < 22) return shifts[1];
  return shifts[2];
}

export const operatorDashboardMock = {
  todayProduction: 47,
  accepted: 42,
  rejected: 5,
  target: 80,
  qualityPercentage: 89.4,
  machineStatus: mockMachines.map(m => ({ id: m.id, name: m.name, status: m.status })),
};

export const adminDashboardMock = {
  todayProduction: 47,
  accepted: 42,
  rejected: 5,
  target: 80,
  qualityPercentage: 89.4,
  activeMachines: 3,
  totalMachines: 4,
  alerts: [
    { id: 1, type: 'warning', message: 'Gauge 2 calibration due in 5 days', time: '2h ago' },
    { id: 2, type: 'info', message: 'Machine INS-02 scheduled maintenance', time: '5h ago' },
    { id: 3, type: 'error', message: 'Component SLEEVE-001 is obsolete', time: '1d ago' },
  ],
  recentProduction: [
    { serial: 'SB2507140010', part: 'BUSH-001', status: 'accepted', time: '10 min ago', operator: 'Rajesh Kumar' },
    { serial: 'SB2507140009', part: 'PISTON-001', status: 'rejected', time: '25 min ago', operator: 'Suresh Patel', reason: 'Outer Diameter Out of Tolerance' },
    { serial: 'SB2507140008', part: 'BUSH-001', status: 'accepted', time: '40 min ago', operator: 'Rajesh Kumar' },
    { serial: 'SB2507140007', part: 'BEARING-001', status: 'accepted', time: '1h ago', operator: 'Suresh Patel' },
    { serial: 'SB2507140006', part: 'SHAFT-001', status: 'qr_marked', time: '1.5h ago', operator: 'Rajesh Kumar' },
  ],
};

export const searchHistoryMock: ProductionRecord[] = [
  {
    id: 1, serial_number: 'SB2507140001', component_id: 1, part_code: 'BUSH-001',
    machine_id: 1, operator_id: 2, status: 'accepted', current_operation: 3,
    rejection_reason: null, started_at: '2026-07-14T06:02:15.000Z', completed_at: '2026-07-14T06:08:42.000Z',
  },
  {
    id: 2, serial_number: 'SB2507140002', component_id: 2, part_code: 'PISTON-001',
    machine_id: 1, operator_id: 2, status: 'rejected', current_operation: 2,
    rejection_reason: 'Outer Diameter Out of Tolerance', started_at: '2026-07-14T06:15:30.000Z', completed_at: '2026-07-14T06:17:05.000Z',
  },
  {
    id: 3, serial_number: 'SB2507140003', component_id: 1, part_code: 'BUSH-001',
    machine_id: 2, operator_id: 3, status: 'qr_marked', current_operation: 3,
    rejection_reason: null, started_at: '2026-07-14T07:30:00.000Z', completed_at: '2026-07-14T07:36:18.000Z',
  },
];
