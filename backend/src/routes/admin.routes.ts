import { Router } from 'express';
import { getSubmission, listSubmissions, updateSubmission } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminRouter = Router();

adminRouter.use(requireAdmin);
adminRouter.get('/submissions', asyncHandler(listSubmissions));
adminRouter.get('/submissions/:id', asyncHandler(getSubmission));
adminRouter.patch('/submissions/:id', asyncHandler(updateSubmission));
