import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { submissionsRouter } from './routes/submissions.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { logger } from './utils/logger.js';

const app = express();

// Behind a platform load balancer (Railway/Render/Vercel), so we can trust
// X-Forwarded-* for correct client IPs (used by the rate limiters) and
// secure-cookie detection.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' })); // small, deliberate cap — this API never needs large bodies
app.use(cookieParser());
app.use(generalRateLimiter);

app.use('/api/health', healthRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Maruthi Catalyst API listening on port ${env.PORT}`, { env: process.env.NODE_ENV });
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down.`);
  await pool.end().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
