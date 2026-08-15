import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    return next(new UnauthorizedError());
  }
  try {
    const payload = authService.verifySession(token);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError('Your session has expired. Please sign in again.'));
  }
}
