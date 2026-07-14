import type {
  Component,
  InspectionPlan,
  Operation,
  Dimension,
  Machine,
  ProductionRecord,
  InspectionResult,
} from '../../../shared/types';

const now = new Date();

export const mockComponents: Component[] = [
  { id: 1, part_code: 'BUSH-001', description: 'Precision Bushing 20mm ID', customer: 'AutoParts Ltd', revision: 2, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 2, part_code: 'PISTON-001', description: 'Hydraulic Piston 50mm', customer: 'MechWorks Inc', revision: 1, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 3, part_code: 'BEARING-001', description: 'Ball Bearing 30mm ID', customer: 'DriveTrain Co', revision: 3, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 4, part_code: 'SHAFT-001', description: 'Drive Shaft 25mm', customer: 'AutoParts Ltd', revision: 1, status: 'active', created_at: now.toISOString(), updated_at: now.toISOString() },
  { id: 5, part_code: 'SLEEVE-001', description: 'Steel Sleeve 40mm', customer: 'MechWorks Inc', revision: 2, status: 'inactive', created_at: now.toISOString(), updated_at: now.toISOString() },
];

export const mockMachines: Machine[] = [
  { id: 1, machine_code: 'INS-01', name: 'Inspection Station 1', ip_address: '192.168.1.101', machine_type: 'inspection', status: 'idle' },
  { id: 2, machine_code: 'INS-02', name: 'Inspection Station 2', ip_address: '192.168.1.102', machine_type: 'inspection', status: 'running' },
  { id: 3, machine_code: 'QR-01', name: 'QR Marking Station', ip_address: '192.168.1.201', machine_type: 'qr_marking', status: 'idle' },
  { id: 4, machine_code: 'PROD-01', name: 'CNC Lathe 01', ip_address: '192.168.1.10', machine_type: 'production', status: 'running' },
];

function makeDimensions(opIdx: number): Dimension[] {
  if (opIdx === 0) return [
    { id: 1, operation_id: 1, dimension_name: 'Outer Diameter', nominal: 20.000, min_limit: 19.995, max_limit: 20.005, unit: 'mm', gauge_id: 1, station_id: 1 },
  ];
  if (opIdx === 1) return [
    { id: 2, operation_id: 2, dimension_name: 'Inner Diameter', nominal: 10.000, min_limit: 9.995, max_limit: 10.005, unit: 'mm', gauge_id: 1, station_id: 1 },
  ];
  return [
    { id: 3, operation_id: 3, dimension_name: 'Length', nominal: 30.000, min_limit: 29.990, max_limit: 30.010, unit: 'mm', gauge_id: 2, station_id: 1 },
  ];
}

export const mockPlans: InspectionPlan[] = [
  {
    id: 1, component_id: 1, revision: 2, is_active: true, created_at: now.toISOString(),
    operations: [
      { id: 1, inspection_plan_id: 1, operation_order: 1, operation_name: 'Rough Turning', dimensions: makeDimensions(0) },
      { id: 2, inspection_plan_id: 1, operation_order: 2, operation_name: 'Finish Grinding', dimensions: makeDimensions(1) },
      { id: 3, inspection_plan_id: 1, operation_order: 3, operation_name: 'Final Inspection', dimensions: makeDimensions(2) },
    ],
  },
  {
    id: 2, component_id: 2, revision: 1, is_active: true, created_at: now.toISOString(),
    operations: [
      { id: 4, inspection_plan_id: 2, operation_order: 1, operation_name: 'Outer Diameter Turning', dimensions: [
        { id: 4, operation_id: 4, dimension_name: 'Outer Diameter', nominal: 50.000, min_limit: 49.990, max_limit: 50.010, unit: 'mm', gauge_id: 1, station_id: 2 },
      ]},
      { id: 5, inspection_plan_id: 2, operation_order: 2, operation_name: 'Surface Inspection', dimensions: [
        { id: 5, operation_id: 5, dimension_name: 'Surface Roughness', nominal: 0.800, min_limit: 0.000, max_limit: 1.600, unit: 'μm', gauge_id: 2, station_id: 2 },
      ]},
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
  const plan = mockPlans.find(p => p.component_id === componentId)!;
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
