import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import type { AuthResponse, User } from '../../../shared/types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const result = await query(
      'SELECT id, username, password_hash, name, role, is_active FROM users WHERE username = $1',
      [username],
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError(401, 'Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );

    const userData: User = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    };

    await query(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, ip_address)
       VALUES ($1, $2, 'login', 'user', $3)`,
      [user.id, user.username, req.ip],
    );

    const response: AuthResponse = { token, user: userData };
    res.json({ success: true, data: response });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.errors[0].message));
    }
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await query(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, ip_address)
         VALUES ($1, $2, 'logout', 'user', $3)`,
        [req.user.userId, req.user.username, req.ip],
      );
    }
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      'SELECT id, username, name, role, is_active FROM users WHERE id = $1',
      [req.user!.userId],
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: result.rows[0] as User });
  } catch (err) {
    next(err);
  }
}
