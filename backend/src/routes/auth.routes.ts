import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimiter, asyncHandler(login));
authRouter.post('/logout', logout);
authRouter.get('/me', requireAdmin, me);
