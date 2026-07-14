-- Gauge DB - Initial Schema
-- Manufacturing Traceability & Quality Inspection System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ Users ============
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'supervisor', 'admin', 'quality')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Components (Part Master) ============
CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  part_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  customer VARCHAR(100),
  revision INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'obsolete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Inspection Plans ============
CREATE TABLE IF NOT EXISTS inspection_plans (
  id SERIAL PRIMARY KEY,
  component_id INT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  revision INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Operations ============
CREATE TABLE IF NOT EXISTS operations (
  id SERIAL PRIMARY KEY,
  inspection_plan_id INT NOT NULL REFERENCES inspection_plans(id) ON DELETE CASCADE,
  operation_order INT NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(inspection_plan_id, operation_order)
);

-- ============ Dimensions ============
CREATE TABLE IF NOT EXISTS dimensions (
  id SERIAL PRIMARY KEY,
  operation_id INT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  dimension_name VARCHAR(100) NOT NULL,
  nominal DECIMAL(10,4) NOT NULL,
  min_limit DECIMAL(10,4) NOT NULL,
  max_limit DECIMAL(10,4) NOT NULL,
  unit VARCHAR(10) DEFAULT 'mm',
  gauge_id INT,
  station_id INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Machines ============
CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  machine_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  machine_type VARCHAR(50) NOT NULL CHECK (machine_type IN ('inspection', 'qr_marking', 'production')),
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'maintenance', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Gauges ============
CREATE TABLE IF NOT EXISTS gauges (
  id SERIAL PRIMARY KEY,
  gauge_name VARCHAR(100) NOT NULL,
  interface_type VARCHAR(50) NOT NULL CHECK (interface_type IN ('serial', 'tcp', 'modbus', 'web_serial')),
  connection_config JSONB DEFAULT '{}',
  calibration_date DATE,
  calibration_due DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add FK constraints for dimensions
ALTER TABLE dimensions ADD CONSTRAINT fk_dimensions_gauge
  FOREIGN KEY (gauge_id) REFERENCES gauges(id) ON DELETE SET NULL;

ALTER TABLE dimensions ADD CONSTRAINT fk_dimensions_station
  FOREIGN KEY (station_id) REFERENCES machines(id) ON DELETE SET NULL;

-- ============ Serial Number Sequences ============
CREATE TABLE IF NOT EXISTS serial_number_sequences (
  id SERIAL PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  last_sequence INT DEFAULT 0,
  UNIQUE(prefix, date)
);

-- ============ Production Records ============
CREATE TABLE IF NOT EXISTS production_records (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(50) UNIQUE NOT NULL,
  component_id INT NOT NULL REFERENCES components(id),
  part_code VARCHAR(50),
  machine_id INT REFERENCES machines(id),
  operator_id INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'accepted', 'rejected', 'qr_marked', 'completed')),
  current_operation INT DEFAULT 1,
  rejection_reason TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============ Inspection Results ============
CREATE TABLE IF NOT EXISTS inspection_results (
  id SERIAL PRIMARY KEY,
  production_record_id INT NOT NULL REFERENCES production_records(id),
  dimension_id INT NOT NULL REFERENCES dimensions(id),
  operation_id INT NOT NULL REFERENCES operations(id),
  measured_value DECIMAL(10,4) NOT NULL,
  nominal DECIMAL(10,4),
  min_limit DECIMAL(10,4),
  max_limit DECIMAL(10,4),
  result VARCHAR(10) NOT NULL CHECK (result IN ('PASS', 'FAIL')),
  gauge_id INT REFERENCES gauges(id),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ QR Codes ============
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  production_record_id INT UNIQUE NOT NULL REFERENCES production_records(id),
  qr_data TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  marked_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'marked', 'failed'))
);

-- ============ Daily Production Counts ============
CREATE TABLE IF NOT EXISTS daily_production_counts (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  machine_id INT REFERENCES machines(id),
  operator_id INT REFERENCES users(id),
  total INT DEFAULT 0,
  accepted INT DEFAULT 0,
  rejected INT DEFAULT 0,
  UNIQUE(date, machine_id, operator_id)
);

-- ============ Audit Logs ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  username VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_production_records_serial ON production_records(serial_number);
CREATE INDEX IF NOT EXISTS idx_production_records_status ON production_records(status);
CREATE INDEX IF NOT EXISTS idx_production_records_started ON production_records(started_at);
CREATE INDEX IF NOT EXISTS idx_inspection_results_record ON inspection_results(production_record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_counts_date ON daily_production_counts(date);
CREATE INDEX IF NOT EXISTS idx_components_part_code ON components(part_code);
