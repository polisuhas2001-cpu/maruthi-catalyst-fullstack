import type { Request, Response } from 'express';
import { submissionSchema, formatZodFieldErrors } from '../validators/submission.validator.js';
import { submissionsService } from '../services/submissions.service.js';
import { emailService } from '../services/email.service.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function createSubmission(req: Request, res: Response) {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Please check the highlighted fields and try again.', 422, formatZodFieldErrors(parsed.error));
  }

  // Honeypot tripped: pretend success so the bot doesn't learn anything,
  // but never touch the database or send an email.
  if (parsed.data.website) {
    logger.warn('Submission blocked by honeypot', { email: parsed.data.email });
    res.status(200).json({ success: true, message: 'Your startup idea has been submitted successfully.', submissionId: 'MC-PENDING' });
    return;
  }

  // The database write is the source of truth for the submission.
  const submission = await submissionsService.create(parsed.data);

  // Email is a notification mechanism, not storage — fire-and-forget so a
  // slow or failing email provider never turns a saved submission into a
  // user-facing error. Failures are logged inside emailService.
  void emailService.notifyAdminOfSubmission(submission);
  void emailService.sendFounderConfirmation(submission);

  res.status(201).json({
    success: true,
    message: 'Your startup idea has been submitted successfully.',
    submissionId: submission.submissionId,
  });
}
