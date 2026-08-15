import { Router } from 'express';
import { submissionRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSubmission } from '../controllers/submissions.controller.js';

export const submissionsRouter = Router();

submissionsRouter.post(
  '/',
  submissionRateLimiter,
  asyncHandler(createSubmission)
);
