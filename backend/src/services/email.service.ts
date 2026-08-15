import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { Submission } from './submissions.service.js';

const resend = new Resend(env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function adminNotificationHtml(submission: Submission): string {
  const rows: [string, string][] = [
    ['Submission ID', submission.submissionId],
    ['Name', submission.fullName],
    ['Email', submission.email],
    ['Phone', submission.contact],
    ['Industry', submission.industry],
    ['Idea Title', submission.title],
  ];
  const rowsHtml = rows
    .map(([label, value]) => `<tr><td style="padding:6px 12px;color:#617174;">${label}</td><td style="padding:6px 12px;">${escapeHtml(value)}</td></tr>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#102f45;max-width:560px;">
      <h2 style="margin-bottom:4px;">New Startup Idea Submission</h2>
      <p style="color:#617174;margin-top:0;">Maruthi Catalyst</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">${rowsHtml}</table>
      <p><strong>Detailed Idea</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(submission.description)}</p>
      <p><strong>Resources Required</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(submission.resources)}</p>
      <p style="color:#617174;font-size:12px;">Submitted at ${submission.createdAt}</p>
    </div>
  `;
}

function founderConfirmationHtml(submission: Submission): string {
  return `
    <div style="font-family:Arial,sans-serif;color:#102f45;max-width:560px;">
      <h2>We have your first draft.</h2>
      <p>Thank you for sharing "${escapeHtml(submission.title)}" with Maruthi Catalyst. Our team will review it confidentially and reach out when there's a thoughtful next step.</p>
      <p style="color:#617174;font-size:12px;">Reference: ${submission.submissionId}</p>
    </div>
  `;
}

export const emailService = {
  // Best-effort: a failure here must never take down a submission that has
  // already been safely stored in the database (see submissions.controller).
  async notifyAdminOfSubmission(submission: Submission): Promise<void> {
    try {
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to: env.ADMIN_EMAIL,
        subject: `New Startup Idea Submission — ${submission.submissionId}`,
        html: adminNotificationHtml(submission),
      });
    } catch (err) {
      logger.error('Failed to send admin notification email', {
        submissionId: submission.submissionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  async sendFounderConfirmation(submission: Submission): Promise<void> {
    try {
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to: submission.email,
        subject: 'We received your idea — Maruthi Catalyst',
        html: founderConfirmationHtml(submission),
      });
    } catch (err) {
      logger.error('Failed to send founder confirmation email', {
        submissionId: submission.submissionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
