import type { Request, Response } from 'express';
import { z } from 'zod';
import { submissionsService } from '../services/submissions.service.js';
import { AppError } from '../utils/errors.js';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.string().trim().max(30).optional(),
});

const updateSchema = z.object({
  status: z.enum(['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'CONTACTED']).optional(),
  adminNotes: z.string().max(5000).optional(),
});

const idParamSchema = z.string().uuid();

export async function listSubmissions(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError('Invalid query parameters.', 400);
  }
  const result = await submissionsService.list(parsed.data);
  res.json(result);
}

export async function getSubmission(req: Request, res: Response) {
  const id = idParamSchema.safeParse(req.params.id);
  if (!id.success) {
    throw new AppError('Invalid submission id.', 400);
  }
  const submission = await submissionsService.getById(id.data);
  res.json({ submission });
}

export async function updateSubmission(req: Request, res: Response) {
  const id = idParamSchema.safeParse(req.params.id);
  if (!id.success) {
    throw new AppError('Invalid submission id.', 400);
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid update payload.', 422);
  }
  const submission = await submissionsService.updateStatus(id.data, parsed.data);
  res.json({ submission });
}
