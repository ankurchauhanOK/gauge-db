import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://gaugeadmin:gaugeadmin@localhost:5432/gauge_db',
  jwtSecret: process.env.JWT_SECRET || 'gauge-db-jwt-secret',
  jwtExpiresIn: 43200, // 12 hours in seconds
};
