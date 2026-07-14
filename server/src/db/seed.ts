import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    const adminHash = await bcrypt.hash('admin123', 10);
    const operatorHash = await bcrypt.hash('operator123', 10);
    const supervisorHash = await bcrypt.hash('supervisor123', 10);

    await client.query(`
      INSERT INTO users (username, password_hash, name, role)
      VALUES
        ('admin', $1, 'System Administrator', 'admin'),
        ('operator1', $2, 'Operator One', 'operator'),
        ('operator2', $2, 'Operator Two', 'operator'),
        ('supervisor', $3, 'Shift Supervisor', 'supervisor'),
        ('quality1', $3, 'Quality Engineer', 'quality')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash, operatorHash, supervisorHash]);

    await client.query(`
      INSERT INTO components (part_code, description, customer)
      VALUES
        ('BUSH-001', 'Precision Bushing 20mm', 'AutoParts Ltd'),
        ('PISTON-001', 'Hydraulic Piston 50mm', 'MechWorks Inc'),
        ('BEARING-001', 'Ball Bearing 30mm ID', 'DriveTrain Co'),
        ('SHAFT-001', 'Drive Shaft 25mm', 'AutoParts Ltd'),
        ('SLEEVE-001', 'Steel Sleeve 40mm', 'MechWorks Inc')
      ON CONFLICT (part_code) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO machines (machine_code, name, machine_type, status)
      VALUES
        ('INS-01', 'Inspection Station 1', 'inspection', 'idle'),
        ('INS-02', 'Inspection Station 2', 'inspection', 'idle'),
        ('QR-01', 'QR Marking Station', 'qr_marking', 'idle'),
        ('PROD-01', 'Production Machine 1', 'production', 'running')
      ON CONFLICT (machine_code) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO gauges (gauge_name, interface_type, connection_config)
      VALUES
        ('Air Gauge 01', 'serial', '{"port": "COM3", "baudRate": 9600}'),
        ('Air Gauge 02', 'serial', '{"port": "COM4", "baudRate": 9600}'),
        ('Digital Micrometer', 'web_serial', '{"baudRate": 115200}')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Seed data inserted successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
