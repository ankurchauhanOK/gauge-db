import { query } from '../config/database';

export async function generateSerialNumber(): Promise<string> {
  const now = new Date();
  const prefix = 'SB';
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');

  const result = await query(
    `INSERT INTO serial_number_sequences (prefix, date, last_sequence)
     VALUES ($1, $2::date, 1)
     ON CONFLICT (prefix, date)
     DO UPDATE SET last_sequence = serial_number_sequences.last_sequence + 1
     RETURNING last_sequence`,
    [prefix, now.toISOString().slice(0, 10)],
  );

  const seq = String(result.rows[0].last_sequence).padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
}
