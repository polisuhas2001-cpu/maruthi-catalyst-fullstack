import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;
const SESSION_TTL = '12h';

export type SessionPayload = { sub: string; email: string };

export const authService = {
  hashPassword: (plain: string) => bcrypt.hash(plain, SALT_ROUNDS),

  verifyPassword: (plain: string, hash: string) => bcrypt.compare(plain, hash),

  signSession: (payload: SessionPayload) =>
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: SESSION_TTL }),

  verifySession: (token: string): SessionPayload => {
    return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
  },
};
