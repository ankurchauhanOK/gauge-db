// ============ User & Auth ============
export type UserRole = 'operator' | 'supervisor' | 'admin' | 'quality';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ============ Components (Part Master) ============
export interface Component {
  id: number;
  part_code: string;
  description: string;
  customer: string;
  revision: number;
  status: 'active' | 'inactive' | 'obsolete';
  created_at: string;
  updated_at: string;
}

export interface ComponentCreate {
  part_code: string;
  description: string;
  customer: string;
}

// ============ Component-Centric Types (replaces InspectionPlan) ============
export interface Measurement {
  id: number;
  component_id: number;
  name: string;
  nominal: number;
  min_limit: number;
  max_limit: number;
  unit: string;
  gauge_id: number | null;
  sort_order: number;
}

export interface ManufacturingStep {
  id: number;
  component_id: number;
  machine_id: number;
  step_order: number;
  operations: ManufacturingOperation[];
}

export interface ManufacturingOperation {
  id: number;
  name: string;
  order: number;
  measurement_ids: number[];
  workstation_id: number | null;
  gauge_id: number | null;
}

export interface ComponentDocument {
  id: number;
  component_id: number;
  name: string;
  type: 'drawing' | 'sop' | 'cad' | 'control_plan' | 'other';
  file_url: string | null;
  uploaded_at: string;
}

export interface ComponentRevision {
  revision: number;
  description: string;
  created_at: string;
  created_by: string;
}

export interface ComponentDetail {
  component: Component;
  measurements: Measurement[];
  flow_steps: ManufacturingStep[];
  documents: ComponentDocument[];
  revisions: ComponentRevision[];
  flow_published: boolean;
}

export interface Workstation {
  id: number;
  name: string;
  machine_id: number;
  gauge_ids: number[];
  assigned_user_id: number | null;
  component_type_id: number;
  is_active: boolean;
}

export type QueueItemStatus = 'waiting' | 'in_progress' | 'completed' | 'failed' | 'rework';

export interface QueueItem {
  id: number;
  component_id: number;
  component_serial: string;
  component_part_code: string;
  step_id: number;
  operation_id: number;
  operation_name: string;
  workstation_id: number;
  gauge_id: number | null;
  status: QueueItemStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type FailAction = 'rework' | 'scrap' | 'skip';

// ============ Inspection Plans (deprecated, kept for migration) ============
export interface InspectionPlan {
  id: number;
  name: string;
  component_id: number;
  revision: number;
  is_active: boolean;
  created_at: string;
  operations: Operation[];
  flow_steps: FlowStep[];
}

export interface FlowStep {
  id: number;
  inspection_plan_id: number;
  machine_id: number;
  step_order: number;
  operations: Operation[];
}

export interface Operation {
  id: number;
  inspection_plan_id: number;
  operation_order: number;
  operation_name: string;
  dimensions: Dimension[];
}

export interface Dimension {
  id: number;
  operation_id: number;
  dimension_name: string;
  nominal: number;
  min_limit: number;
  max_limit: number;
  unit: string;
  gauge_id: number | null;
  station_id: number | null;
}

// ============ Machines & Gauges ============
export type MachineType = 'inspection' | 'qr_marking' | 'production';
export type MachineStatus = 'idle' | 'running' | 'maintenance' | 'offline';

export interface Machine {
  id: number;
  machine_code: string;
  name: string;
  ip_address: string;
  machine_type: MachineType;
  status: MachineStatus;
}

export type GaugeInterface = 'serial' | 'tcp' | 'modbus' | 'web_serial';

export interface Gauge {
  id: number;
  gauge_name: string;
  interface_type: GaugeInterface;
  connection_config: Record<string, unknown>;
  calibration_date: string | null;
  calibration_due: string | null;
  is_active: boolean;
}

// ============ Production & Inspection ============
export type ProductionStatus =
  | 'in_progress'
  | 'accepted'
  | 'rejected'
  | 'qr_marked'
  | 'completed';

export interface ProductionRecord {
  id: number;
  serial_number: string;
  component_id: number;
  part_code: string;
  machine_id: number;
  operator_id: number;
  status: ProductionStatus;
  current_operation: number;
  rejection_reason: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface StartProcessResponse {
  record: ProductionRecord;
  next_operation: Operation | null;
}

export interface InspectionResult {
  id: number;
  production_record_id: number;
  dimension_id: number;
  operation_id: number;
  measured_value: number;
  nominal: number;
  min_limit: number;
  max_limit: number;
  result: 'PASS' | 'FAIL';
  gauge_id: number | null;
  measured_at: string;
}

export interface MeasureRequest {
  dimension_id: number;
  measured_value: number;
  gauge_id: number | null;
}

// ============ QR ============
export interface QRCode {
  id: number;
  production_record_id: number;
  qr_data: string;
  generated_at: string;
  marked_at: string | null;
  status: 'pending' | 'marked' | 'failed';
}

// ============ Dashboard ============
export interface OperatorDashboard {
  today_production: number;
  accepted: number;
  rejected: number;
  machine_status: { id: number; name: string; status: MachineStatus };
}

export interface SupervisorDashboard {
  today_production: number;
  target: number;
  accepted: number;
  rejected: number;
  quality_percentage: number;
  machine_statuses: { id: number; name: string; status: MachineStatus }[];
  machine_wise: { machine_name: string; total: number; accepted: number; rejected: number }[];
  operator_wise: { operator_name: string; total: number; accepted: number; rejected: number }[];
}

// ============ Traceability ============
export interface TraceabilityEvent {
  event: string;
  timestamp: string;
  details: string;
}

// ============ Reports ============
export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  machine_id?: number;
  operator_id?: number;
  component_id?: number;
}

// ============ Audit ============
export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown>;
  created_at: string;
}

// ============ API Response Wrapper ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ Gauge Driver Interface ============
export interface GaugeConfig {
  interface_type: GaugeInterface;
  baudRate?: number;
  port?: string;
  host?: string;
  portNumber?: number;
  stabilityWindow?: number;
  stabilityTolerance?: number;
}

export interface GaugeReading {
  value: number;
  timestamp: number;
  stable: boolean;
}

export interface GaugeDriver {
  connect(config: GaugeConfig): Promise<void>;
  disconnect(): Promise<void>;
  onReading(callback: (reading: GaugeReading) => void): void;
  onStable(callback: (reading: GaugeReading) => void): void;
  onError(callback: (error: Error) => void): void;
}
