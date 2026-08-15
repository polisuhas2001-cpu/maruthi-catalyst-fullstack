import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';
import { AppError, UnauthorizedError } from '../utils/errors.js';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  maxAge: 12 * 60 * 60 * 1000, // 12h, matches the JWT expiry
  path: '/',
};

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Please enter a valid email and password.', 422);
  }

  const { email, password } = parsed.data;

  const result = await pool.query<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM admin_users WHERE email = $1',
    [email.toLowerCase()],
  );

  // Same error for "no such user" and "wrong password" — don't reveal
  // which one it was.
  const genericError = new UnauthorizedError('Invalid email or password.');

  if (result.rows.length === 0) {
    throw genericError;
  }

  const admin = result.rows[0];
  const valid = await authService.verifyPassword(password, admin.password_hash);
  if (!valid) {
    throw genericError;
  }

  const token = authService.signSession({ sub: admin.id, email: admin.email });
  res.cookie(env.SESSION_COOKIE_NAME, token, cookieOptions);
  res.json({ success: true, email: admin.email });
}

export function logout(req: Request, res: Response) {
  res.clearCookie(env.SESSION_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
}

export function me(req: Request, res: Response) {
  if (!req.admin) {
    throw new UnauthorizedError();
  }
  res.json({ email: req.admin.email });
}
